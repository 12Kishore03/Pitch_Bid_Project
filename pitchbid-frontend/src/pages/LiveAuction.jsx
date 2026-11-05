import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAuctionById } from "../api/auctionApi";
import { getAuctionPlayers } from "../api/playerApi";
import { getAuctionTeams, getTeamPlayers } from "../api/teamApi";

import {
  createOrGetAuctionSession,
  getAuctionSession,
  selectAuctionPlayer,
  raiseAuctionBid,
  finalizePlayerSold,
  finalizePlayerUnsold,
  getAuctionResults,
} from "../api/liveAuctionApi";

const money = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.detail ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong. Please try again.";

const normalizeStatus = (value) =>
  String(value || "").trim().toUpperCase();

const getPlayerId = (player) =>
  player?.id != null ? String(player.id) : "";

const getTeamId = (team) =>
  team?.id != null ? String(team.id) : "";

// Convert the persisted AuctionResultResponse DTO into the shape used by this UI.
const normalizeAuctionResult = (result, players = []) => {
  const playerId = result?.player?.id ?? result?.playerId ?? result?.player?.playerId;
  const teamId = result?.team?.id ?? result?.teamId ?? null;
  const playerFromList = players.find(
    (player) => String(player.id) === String(playerId)
  );

  const rawStatus = normalizeStatus(
    result?.resultStatus ?? result?.status
  );
  const status = rawStatus === "SOLD" ? "SOLD" : "UNSOLD";

  const player = {
    ...(playerFromList || {}),
    ...(result?.player || {}),
    id: playerId != null ? String(playerId) : "",
    fullName:
      result?.player?.fullName ||
      result?.playerName ||
      playerFromList?.fullName ||
      "Unknown player",
    playerRole:
      result?.player?.playerRole ||
      playerFromList?.playerRole ||
      "",
    basePrice: Number(
      result?.player?.basePrice ??
      result?.basePrice ??
      playerFromList?.basePrice ??
      0
    ),
  };

  return {
    id: String(result?.id ?? `${player.id}-${status}`),
    player,
    playerId: player.id,
    playerName: player.fullName,
    teamId: teamId != null ? String(teamId) : "",
    teamName:
      result?.team?.teamName ||
      result?.teamName ||
      "",
    shortName:
      result?.team?.teamShortName ||
      result?.shortName ||
      "",
    basePrice: player.basePrice,
    soldPrice: Number(result?.finalPrice ?? result?.soldPrice ?? 0),
    // The current backend DTO does not include a round number.
    round: result?.roundNumber ?? result?.round ?? "—",
    status,
    time: result?.finalizedAt
      ? new Date(result.finalizedAt).toLocaleString("en-IN")
      : result?.time || "—",
  };
};

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function LiveAuction() {
  const { auctionId } = useParams();

  const [auction, setAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [teamId, setTeamId] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("ready");

  // -------------------------------------------------------
  // SESSION RESPONSE -> FRONTEND STATE
  // -------------------------------------------------------

  const applySession = useCallback((data) => {
    if (!data) return;

    setSession(data);
    setSeconds(Math.max(0, Number(data.remainingSeconds || 0)));

    const status = normalizeStatus(data.sessionStatus);

    if (status === "BIDDING") {
      setPhase("bidding");
    } else if (status === "PAUSED") {
      setPhase("paused");
    } else if (status === "COMPLETED") {
      setPhase("completed");
    } else {
      setPhase("ready");
    }
  }, []);

  // -------------------------------------------------------
  // LOAD AUCTION, PLAYERS AND TEAMS
  // -------------------------------------------------------

  const loadAuctionData = useCallback(async () => {
    if (!auctionId) {
      throw new Error("Auction ID is missing from the URL.");
    }

    const [auctionData, playerData, teamData] = await Promise.all([
      getAuctionById(auctionId),
      getAuctionPlayers(auctionId),
      getAuctionTeams(auctionId),
    ]);

    if (!auctionData) {
      throw new Error("The server did not return this auction.");
    }

    const approvedPlayers = (Array.isArray(playerData) ? playerData : [])
      .filter(
        (player) =>
          normalizeStatus(player.status) === "APPROVED" &&
          normalizeStatus(player.registrationType || "INDIVIDUAL") ===
            "INDIVIDUAL"
      )
      .map((player) => ({
        ...player,
        id: getPlayerId(player),
        basePrice: Number(player.basePrice || 0),
      }));

    const approvedTeams = (Array.isArray(teamData) ? teamData : [])
      .filter((team) => normalizeStatus(team.status) === "APPROVED");

    const initialBudget = Number(auctionData.teamBudget || 0);

    const normalizedTeams = await Promise.all(
      approvedTeams.map(async (team) => {
        let purchasedPlayers = [];

        try {
          const response = await getTeamPlayers(auctionId, team.id);
          purchasedPlayers = Array.isArray(response) ? response : [];
        } catch (err) {
          console.warn(
            `Could not load roster for team ${team.id}:`,
            err
          );
        }

        const remainingBudget = Number(
          team.remainingBudget ?? initialBudget
        );

        return {
          ...team,
          id: getTeamId(team),
          teamName: team.teamName || "Unnamed team",
          shortName: team.teamShortName || "",
          ownerName: team.ownerName || "",
          budget: initialBudget,
          remainingBudget,
          spent: Math.max(0, initialBudget - remainingBudget),
          bought: purchasedPlayers.length,
        };
      })
    );

    setAuction(auctionData);
    setPlayers(approvedPlayers);
    setTeams(normalizedTeams);

    return {
      auction: auctionData,
      players: approvedPlayers,
      teams: normalizedTeams,
    };
  }, [auctionId]);

  // -------------------------------------------------------
  // INITIAL LOAD + CREATE/RETRIEVE BACKEND SESSION
  // -------------------------------------------------------

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);
      setSessionLoading(true);
      setLoadError("");
      setError("");
      setMessage("");

      try {
        const data = await loadAuctionData();

        if (!active) return;

        const auctionStatus = normalizeStatus(data.auction.status);

        if (auctionStatus !== "LIVE") {
          throw new Error(
            `This auction is currently ${data.auction.status || "not LIVE"}. ` +
            "The live bidding session can only be opened for a LIVE auction."
          );
        }

        const [sessionData, resultData] = await Promise.all([
          createOrGetAuctionSession(auctionId),
          getAuctionResults(auctionId),
        ]);

        if (!active) return;

        applySession(sessionData);

        const persistedResults = Array.isArray(resultData)
          ? resultData.map((item) =>
              normalizeAuctionResult(item, data.players)
            )
          : [];

        setResults(persistedResults);
        setMessage(
          persistedResults.length
            ? `Live auction connected. Restored ${persistedResults.length} finalized result(s) from the database.`
            : "Live auction session connected successfully."
        );
      } catch (err) {
        console.error("Live auction initialization error:", err);

        if (active) {
          setLoadError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
          setSessionLoading(false);
        }
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [auctionId, loadAuctionData, applySession]);

  // -------------------------------------------------------
  // POLL THE BACKEND SESSION
  // Backend remains the source of truth.
  // -------------------------------------------------------

  useEffect(() => {
    if (!auctionId || !session || loading) return;

    let active = true;

    const intervalId = window.setInterval(async () => {
      try {
        const data = await getAuctionSession(auctionId);

        if (active && data) {
          applySession(data);
        }
      } catch (err) {
        // A temporary polling error should not erase the current screen.
        console.warn("Session synchronization failed:", err);
      }
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [auctionId, session?.id, loading, applySession]);

  // -------------------------------------------------------
  // LOCAL DISPLAY COUNTDOWN
  // The backend's remainingSeconds is authoritative.
  // -------------------------------------------------------

  useEffect(() => {
    if (normalizeStatus(session?.sessionStatus) !== "BIDDING") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSeconds((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session?.sessionStatus, session?.bidExpiresAt]);

  // -------------------------------------------------------
  // DERIVED SESSION DATA
  // -------------------------------------------------------

  const currentPlayer = useMemo(() => {
    if (!session?.currentPlayer) return null;

    const currentId = String(session.currentPlayer.id);

    return (
      players.find((player) => player.id === currentId) ||
      {
        ...session.currentPlayer,
        id: currentId,
        fullName:
          session.currentPlayer.fullName || "Unknown player",
        basePrice: Number(session.currentPlayer.basePrice || 0),
      }
    );
  }, [session, players]);

  const currentBid = Number(session?.currentBid || 0);

  const highestTeamId = session?.highestBidTeam?.id != null
    ? String(session.highestBidTeam.id)
    : "";

  const highestTeam = teams.find(
    (team) => team.id === highestTeamId
  );

  const sessionStatus = normalizeStatus(session?.sessionStatus);

  const bidding = sessionStatus === "BIDDING";
  const paused = sessionStatus === "PAUSED";
  const ready = sessionStatus === "READY";

  const increment = Math.max(
    1,
    Number(auction?.bidIncrement || 1)
  );

  const maxRoster = Number(auction?.maxPlayers || 0);

  const pendingPlayers = players.filter(
    (player) =>
      !results.some(
        (result) => String(result.playerId) === player.id
      )
  );

  const unsoldPlayers = results
    .filter((result) => result.status === "UNSOLD")
    .map((result) => result.player)
    .filter(Boolean);

  const nextBidAmount = currentBid + increment;

  const teamsWithEligibility = teams.map((team) => {
    const remaining = Number(team.remainingBudget ?? 0);

    const full =
      maxRoster > 0 && team.bought >= maxRoster;

    const eligible =
      !full && remaining >= nextBidAmount;

    return {
      ...team,
      remaining,
      eligible,
      reason: full
        ? "Roster limit reached"
        : remaining < nextBidAmount
          ? "Insufficient budget for next bid"
          : "",
    };
  });

  // -------------------------------------------------------
  // SELECT PLAYER
  // Calls the backend session player-selection endpoint.
  // -------------------------------------------------------

  const choosePlayer = async (player) => {
    if (!ready) {
      setError(
        "The session must be READY before selecting another player."
      );
      return;
    }

    if (!player?.id) {
      setError("Invalid player selected.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await selectAuctionPlayer(
        auctionId,
        player.id
      );

      applySession(response);
      setTeamId("");
      setMessage(
        `${player.fullName} selected. Bidding has started.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------
  // RAISE BID
  // Only team ID is sent.
  // The backend calculates and saves the bid amount.
  // -------------------------------------------------------

  const raiseBid = async () => {
    if (!bidding) {
      setError("There is no active bidding session.");
      return;
    }

    if (seconds <= 0) {
      setError("The bidding timer has expired.");
      return;
    }

    if (!teamId) {
      setError("Select the team whose owner raised their hand.");
      return;
    }

    const selectedTeam = teamsWithEligibility.find(
      (team) => team.id === String(teamId)
    );

    if (!selectedTeam) {
      setError("Selected team was not found.");
      return;
    }

    if (!selectedTeam.eligible) {
      setError(selectedTeam.reason || "This team cannot bid.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await raiseAuctionBid(
        auctionId,
        teamId
      );

      applySession(response);

      setMessage(
        `${selectedTeam.teamName} placed the next bid.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------
  // FINALIZE SOLD
  // Save the outcome through the backend.
  // -------------------------------------------------------

  const finalizeSold = async () => {
    if (!currentPlayer || !highestTeamId) {
      setError("There is no highest bidder. Mark the player unsold instead.");
      return;
    }

    const team = teams.find(
      (item) => item.id === highestTeamId
    );

    if (!team) {
      setError("The highest-bidding team could not be found.");
      return;
    }

    const confirmed = window.confirm(
      `Sell ${currentPlayer.fullName} to ${team.teamName} for ${money(currentBid)}?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    const finalizedPlayer = { ...currentPlayer };

    try {
      await finalizePlayerSold(auctionId);

      // Finalization endpoints return AuctionResultResponse, not a session DTO.
      // Reload both persisted results and the current session from the backend.
      const [latestResults, latestSession] = await Promise.all([
        getAuctionResults(auctionId),
        getAuctionSession(auctionId),
      ]);

      setResults(
        (Array.isArray(latestResults) ? latestResults : []).map((item) =>
          normalizeAuctionResult(item, players)
        )
      );
      applySession(latestSession);

      // Refresh team budgets and rosters from the backend.
      const refreshed = await loadAuctionData();

      setMessage(
        `${finalizedPlayer.fullName} sold to ${team.teamName} for ${money(currentBid)}.`
      );

      console.info("Updated teams:", refreshed.teams);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------
  // FINALIZE UNSOLD
  // -------------------------------------------------------

  const finalizeUnsold = async () => {
    if (!currentPlayer) {
      setError("There is no active player to finalize.");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${currentPlayer.fullName} as UNSOLD?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");
    setMessage("");

    const finalizedPlayer = { ...currentPlayer };

    try {
      await finalizePlayerUnsold(auctionId);

      // Finalization returns a result DTO. Reload the real session separately.
      const [latestResults, latestSession] = await Promise.all([
        getAuctionResults(auctionId),
        getAuctionSession(auctionId),
      ]);

      setResults(
        (Array.isArray(latestResults) ? latestResults : []).map((item) =>
          normalizeAuctionResult(item, players)
        )
      );
      applySession(latestSession);

      setMessage(`${finalizedPlayer.fullName} marked as UNSOLD.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------
  // FINISH DISPLAY
  // Final auction lifecycle completion remains controlled
  // by the existing auction management workflow.
  // -------------------------------------------------------

  const exportCsv = () => {
    if (!results.length) {
      setError("There are no finalized outcomes to export.");
      return;
    }

    const soldResults = results.filter(
      (result) => normalizeStatus(result.status) === "SOLD"
    );

    const unsoldResults = results.filter(
      (result) => normalizeStatus(result.status) === "UNSOLD"
    );

    const totalSpent = soldResults.reduce(
      (total, result) => total + Number(result.soldPrice || 0),
      0
    );

    const totalRemainingBudget = teams.reduce(
      (total, team) => total + Number(team.remainingBudget ?? 0),
      0
    );

    const exportDate = new Date().toLocaleString("en-IN");

    const rows = [
      // REPORT TITLE
      ["PITCHBID - CRICKET AUCTION REPORT"],
      ["Report generated on", exportDate],
      [],

      // 1. AUCTION INFORMATION
      ["1. AUCTION INFORMATION"],
      ["Auction name", auction?.auctionName || "—"],
      ["Auction ID", auction?.id || auctionId || "—"],
      ["Auction status", auction?.status || "—"],
      [
        "Auction date",
        auction?.auctionDate ||
          auction?.startDate ||
          auction?.createdAt ||
          "Not provided"
      ],
      ["Budget allocated per team (₹)", Number(auction?.teamBudget || 0)],
      ["Configured bid increment (₹)", Number(auction?.bidIncrement || 0)],
      ["Maximum players per team", auction?.maxPlayers ?? "Not specified"],
      ["Unsold player re-entry", auction?.playerReentry || "Not specified"],
      [],

      // 2. AUCTION SUMMARY
      ["2. AUCTION SUMMARY"],
      ["Description", "Count / Amount"],
      ["Approved teams participating", teams.length],
      ["Approved players in auction", players.length],
      ["Players with finalized outcomes", results.length],
      ["Total players SOLD", soldResults.length],
      ["Total players UNSOLD", unsoldResults.length],
      [
        "Players not yet finalized",
        Math.max(0, players.length - results.length)
      ],
      ["Total amount spent on players (₹)", totalSpent],
      ["Combined remaining team budget (₹)", totalRemainingBudget],
      [],

      // 3. PLAYER-WISE RESULTS
      ["3. PLAYER-WISE AUCTION RESULTS"],
      [
        "S.No.",
        "Player ID",
        "Player Name",
        "Player Role",
        "Country",
        "City",
        "Age",
        "Batting Style",
        "Bowling Style",
        "Base Price (₹)",
        "Final Status",
        "Purchasing Team",
        "Team ID",
        "Final Sold Price (₹)",
        "Finalized At"
      ],

      ...results.map((result, index) => {
        const player =
          result.player ||
          players.find(
            (item) => String(item.id) === String(result.playerId)
          ) ||
          {};

        const status = normalizeStatus(result.status);

        return [
          index + 1,
          result.playerId || player.id || "",
          result.playerName || player.fullName || "Unknown player",
          player.playerRole || "",
          player.country || player.nationality || "",
          player.city || "",
          player.age ?? "",
          player.battingStyle || "",
          player.bowlingStyle || "",
          Number(result.basePrice ?? player.basePrice ?? 0),
          status,
          status === "SOLD" ? result.teamName || "" : "",
          status === "SOLD" ? result.teamId || "" : "",
          status === "SOLD" ? Number(result.soldPrice || 0) : "",
          result.time || ""
        ];
      }),

      [],

      // 4. TEAM BUDGET SUMMARY
      ["4. TEAM BUDGET SUMMARY"],
      [
        "S.No.",
        "Team Name",
        "Team Short Name",
        "Team ID",
        "Team Owner",
        "Initial Budget (₹)",
        "Players Purchased",
        "Total Amount Spent (₹)",
        "Remaining Budget (₹)",
        "Budget Utilized (%)"
      ],

      ...teams.map((team, index) => {
        const teamSoldResults = soldResults.filter(
          (result) => String(result.teamId) === String(team.id)
        );

        const spent = teamSoldResults.reduce(
          (total, result) => total + Number(result.soldPrice || 0),
          0
        );

        const initialBudget = Number(
          team.budget ?? auction?.teamBudget ?? 0
        );

        const remainingBudget = Number(
          team.remainingBudget ?? Math.max(0, initialBudget - spent)
        );

        const utilized =
          initialBudget > 0
            ? ((spent / initialBudget) * 100).toFixed(2)
            : "0.00";

        return [
          index + 1,
          team.teamName || "",
          team.shortName || team.teamShortName || "",
          team.id || "",
          team.ownerName || "",
          initialBudget,
          teamSoldResults.length,
          spent,
          remainingBudget,
          utilized
        ];
      }),

      [],

      // 5. EXPLANATION FOR NEW USERS
      ["5. HOW TO READ THIS REPORT"],
      [
        "SOLD",
        "The player was purchased by the team shown in the Purchasing Team column."
      ],
      [
        "UNSOLD",
        "The player was not purchased during this auction attempt."
      ],
      [
        "Base Price",
        "The player's starting price before bidding began."
      ],
      [
        "Final Sold Price",
        "The final amount paid by the purchasing team for a SOLD player."
      ],
      [
        "Configured Bid Increment",
        "The fixed amount added by the auction system for every accepted bid."
      ],
      [
        "Budget Utilized (%)",
        "The percentage of the team's initial budget spent on players."
      ],
      [
        "Remaining Budget",
        "The amount of money available to the team after completed purchases."
      ],
      [
        "Note",
        "Only finalized player outcomes are included in the player-wise results section."
      ]
    ];

    const filename =
      `${(auction?.auctionName || "PitchBid").replace(/[^a-z0-9-_]/gi, "_")}_auction_report.csv`;

    downloadCsv(filename, rows);

    setMessage("Detailed auction report exported successfully.");
    setError("");
  };

  // -------------------------------------------------------
  // LOADING / ERROR SCREENS
  // -------------------------------------------------------

  if (loading || sessionLoading) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow">
          <p className="font-semibold text-blue-800">
            Connecting to the live auction session...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || !auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-blue-950">
            Unable to open live auction
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {loadError || "The requested auction could not be found."}
          </p>

          <Link
            className="mt-4 inline-block text-blue-700"
            to={`/auction-management/${auctionId}`}
          >
            Back to Auction Management
          </Link>
        </div>
      </main>
    );
  }

  if (!teams.length || !players.length) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
          <Link
            className="text-blue-700"
            to={`/auction-management/${auctionId}`}
          >
            ← Auction Management
          </Link>

          <h1 className="mt-5 text-2xl font-bold text-blue-950">
            Live auction is not ready
          </h1>

          <p className="mt-3 text-gray-600">
            The backend must return at least one approved individual
            player and one approved team.
          </p>

          <p className="mt-3">
            Approved players: {players.length} · Approved teams: {teams.length}
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------

  return (
    <main className="min-h-screen bg-blue-50 p-3 text-slate-800 sm:p-4">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3">

        {/* HEADER */}
        <header className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              PitchBid · Live Auction
            </p>

            <h1 className="truncate text-lg font-extrabold text-blue-950 sm:text-xl">
              {auction.auctionName}
            </h1>

            <p className="text-xs text-slate-500">
              Auction ID: {auction.id}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
              {sessionStatus || "Connecting"}
            </span>

            <Link
              className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:text-sm"
              to={`/auction-management/${auctionId}`}
            >
              ← Management
            </Link>
          </div>
        </header>

        {/* MESSAGES */}
        {(error || message) && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              error
                ? "border border-amber-200 bg-amber-50 text-amber-900"
                : "border border-blue-100 bg-white text-blue-800"
            }`}
          >
            {error ? "Action needed: " : ""}
            {error || message}
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Approved teams", teams.length],
            ["Approved players", players.length],
            ["Finalized outcomes", results.length],
            [
              "Time remaining",
              `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-blue-100 bg-white px-3 py-3 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
              </p>

              <p className="mt-1 text-xl font-extrabold text-blue-950">
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">

          {/* CURRENT PLAYER */}
          <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-blue-950">
                Current Player
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  bidding
                    ? "bg-green-100 text-green-800"
                    : paused
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-50 text-blue-800"
                }`}
              >
                {bidding
                  ? "Bidding Live"
                  : paused
                    ? "Paused"
                    : ready
                      ? "Ready"
                      : sessionStatus}
              </span>
            </div>

            {currentPlayer ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,.7fr)]">

                  {/* PLAYER DETAILS */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                      {currentPlayer.playerRole || "Cricket Player"}
                    </p>

                    <h3 className="mt-1 break-words text-2xl font-extrabold text-blue-950">
                      {currentPlayer.fullName}
                    </h3>

                    {currentPlayer.jerseyName && (
                      <p className="mt-1 text-sm text-slate-600">
                        Jersey: {currentPlayer.jerseyName}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-slate-600">
                      {currentPlayer.city || "City not provided"}
                      {currentPlayer.age
                        ? ` · Age ${currentPlayer.age}`
                        : ""}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500">Base price</p>
                        <p className="font-extrabold text-blue-950">
                          {money(currentPlayer.basePrice)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs text-slate-500">Player ID</p>
                        <p className="truncate font-bold text-blue-950">
                          {currentPlayer.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="text-slate-500">Batting:</span>{" "}
                        <b>{currentPlayer.battingStyle || "—"}</b>
                      </p>

                      <p>
                        <span className="text-slate-500">Bowling:</span>{" "}
                        <b>{currentPlayer.bowlingStyle || "—"}</b>
                      </p>

                      <p>
                        <span className="text-slate-500">Wicketkeeper:</span>{" "}
                        <b>{currentPlayer.wicketkeeper ? "Yes" : "No"}</b>
                      </p>
                    </div>
                  </div>

                  {/* LIVE BID DETAILS */}
                  <div className="flex flex-col justify-center gap-4 rounded-xl bg-blue-950 p-4 text-white">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                        Time remaining
                      </p>

                      <p
                        className={`mt-1 font-mono text-4xl font-black tabular-nums ${
                          seconds <= 5 && bidding
                            ? "text-amber-300"
                            : "text-white"
                        }`}
                      >
                        {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                        {String(seconds % 60).padStart(2, "0")}
                      </p>
                    </div>

                    <div className="border-t border-blue-800 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
                        Current highest bid
                      </p>

                      <p className="mt-1 text-3xl font-black">
                        {money(currentBid)}
                      </p>

                      <p className="truncate text-xs text-blue-200">
                        {highestTeam?.teamName ||
                          session?.highestBidTeam?.teamName ||
                          "No team has bid yet"}
                      </p>
                    </div>

                    <div className="border-t border-blue-800 pt-3">
                      <p className="text-xs text-blue-200">
                        Configured bid increment
                      </p>

                      <p className="text-lg font-bold">
                        {money(increment)}
                      </p>

                      <p className="text-xs text-blue-200">
                        Next bid: {money(nextBidAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CREATOR ACTIONS */}
                <div className="mt-4 flex flex-wrap gap-2">

                  {bidding && (
                    <>
                      <button
                        onClick={raiseBid}
                        disabled={actionLoading || seconds <= 0 || !teamId}
                        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {actionLoading
                          ? "Please wait..."
                          : `Raise Bid +${money(increment)}`}
                      </button>

                      <button
                        onClick={finalizeSold}
                        disabled={
                          actionLoading ||
                          !highestTeamId
                        }
                        className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Finalize SOLD
                      </button>

                      <button
                        onClick={finalizeUnsold}
                        disabled={actionLoading}
                        className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                      >
                        Finalize UNSOLD
                      </button>
                    </>
                  )}

                  {paused && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      The backend session is paused. Use the existing
                      auction management workflow for auction lifecycle
                      controls.
                    </p>
                  )}

                  {ready && (
                    <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      Select a player from the eligible players list to
                      start their bidding session.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-6 text-center">
                <h3 className="text-lg font-bold text-blue-950">
                  No player is currently selected
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Select an approved player below. The backend will start
                  the bidding session.
                </p>
              </div>
            )}

            {/* PLAYER QUEUE */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="font-bold text-blue-950">
                Eligible Players
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Sold and unsold players are excluded from this queue. Select a player only when the session is READY.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {pendingPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => choosePlayer(player)}
                    disabled={!ready || actionLoading}
                    className="rounded-lg border border-slate-200 p-3 text-left hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block truncate text-sm font-bold text-blue-950">
                      {player.fullName}
                    </span>

                    <span className="block text-xs text-slate-500">
                      {player.playerRole || "Player"} · Base{" "}
                      {money(player.basePrice)}
                    </span>
                  </button>
                ))}

                {!pendingPlayers.length && (
                  <p className="col-span-full py-3 text-sm text-slate-500">
                    All remaining approved players have already been finalized.
                  </p>
                )}
              </div>

              {unsoldPlayers.length > 0 &&
                auction.playerReentry === "Allow" && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    {unsoldPlayers.length} player(s) are recorded as UNSOLD.
                    Re-entry is configured for this auction, but the current
                    backend prevents selecting an already-finalized player.
                    Re-entry needs a backend workflow change before it can be enabled.
                  </div>
                )}
            </div>
          </section>

          {/* TEAMS AND BUDGETS */}
          <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-blue-950">
              Teams & Budgets
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              The Creator selects the team whose owner raised their hand.
              The backend applies the configured bid increment.
            </p>

            <label
              htmlFor="interested-team"
              className="mt-4 block text-xs font-bold text-slate-700"
            >
              Interested team
            </label>

            <select
              id="interested-team"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              disabled={!bidding || actionLoading}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm disabled:bg-slate-100"
            >
              <option value="">Select team</option>

              {teamsWithEligibility.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  disabled={!team.eligible}
                >
                  {team.shortName
                    ? `${team.shortName} — `
                    : ""}
                  {team.teamName} · {money(team.remaining)}
                  {team.reason ? ` — ${team.reason}` : ""}
                </option>
              ))}
            </select>

            <div className="mt-4 space-y-3">
              {teamsWithEligibility.map((team) => (
                <div
                  key={team.id}
                  className={`rounded-xl border p-3 ${
                    team.id === highestTeamId
                      ? "border-green-300 bg-green-50"
                      : team.eligible
                        ? "border-blue-100 bg-white"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-blue-950">
                        {team.shortName
                          ? `${team.shortName} · `
                          : ""}
                        {team.teamName}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {team.ownerName || "Team owner"} ·{" "}
                        {team.bought} purchased
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                        team.id === highestTeamId
                          ? "bg-green-100 text-green-800"
                          : team.eligible
                            ? "bg-blue-50 text-blue-800"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {team.id === highestTeamId
                        ? "Highest bidder"
                        : team.eligible
                          ? "Eligible"
                          : "Unavailable"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] text-slate-500">
                        Remaining budget
                      </p>

                      <p className="text-sm font-extrabold text-blue-950">
                        {money(team.remaining)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] text-slate-500">
                        Spent so far
                      </p>

                      <p className="text-sm font-bold text-slate-700">
                        {money(team.spent)}
                      </p>
                    </div>
                  </div>

                  {team.reason && (
                    <p className="mt-2 text-xs text-slate-500">
                      {team.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* FINALIZED OUTCOMES */}
        <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-blue-950">
                Finalized Outcomes ({results.length})
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Persisted auction outcomes loaded from the database.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportCsv}
                disabled={!results.length}
                className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                Export CSV
              </button>

              <button
                onClick={() => window.print()}
                className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"
              >
                Print / PDF
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-blue-50 text-blue-950">
                <tr>
                  {[
                    "Player",
                    "Round",
                    "Purchasing team",
                    "Final price",
                    "Time",
                    "Status",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-2.5">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {results.map((result) => (
                  <tr
                    key={result.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-2">
                      {result.playerName}
                    </td>

                    <td className="px-3 py-2">
                      {result.round}
                    </td>

                    <td className="px-3 py-2">
                      {result.teamName || "—"}
                    </td>

                    <td className="px-3 py-2">
                      {result.status === "SOLD"
                        ? money(result.soldPrice)
                        : "—"}
                    </td>

                    <td className="px-3 py-2">
                      {result.time || "—"}
                    </td>

                    <td className="px-3 py-2">
                      {result.status}
                    </td>
                  </tr>
                ))}

                {!results.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-5 text-center text-sm text-slate-500"
                    >
                      Finalized outcomes will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
