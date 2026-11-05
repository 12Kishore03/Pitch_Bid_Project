
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getAuctionById,
  startAuction,
  resumeAuction,
} from "../api/auctionApi";

import {
  getPlayerRegistrations,
  getTeamOwnerRegistrations,
  approvePlayerRegistration,
  rejectPlayerRegistration,
  approveTeamOwnerRegistration,
  rejectTeamOwnerRegistration,
} from "../api/registrationApi";

// Backend DTOs expose these identifiers as playerId and registrationId.
// The id fallbacks keep compatibility with older response shapes.
const getPlayerRegistrationId = (player) =>
  player?.playerId ?? player?.id ?? player?.idPlayer ?? null;

const getOwnerRegistrationId = (owner) =>
  owner?.registrationId ?? owner?.id ?? owner?.teamOwnerRegistrationId ?? null;

function AuctionManagement() {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [auction, setAuction] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [ownerRegistrations, setOwnerRegistrations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  // ==========================================
  // FETCH ALL AUCTION MANAGEMENT DATA
  // ==========================================

  const loadAuctionData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        auctionResponse,
        playerResponse,
        ownerResponse,
      ] = await Promise.all([
        getAuctionById(auctionId),
        getPlayerRegistrations(auctionId),
        getTeamOwnerRegistrations(auctionId),
      ]);

      setAuction(auctionResponse);

      setRegistrations(
        Array.isArray(playerResponse) ? playerResponse : []
      );

      setOwnerRegistrations(
        Array.isArray(ownerResponse) ? ownerResponse : []
      );

    } catch (err) {
      console.error("Auction management loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load auction management information."
      );

    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  // ==========================================
  // AUCTION LIFECYCLE
  // ==========================================

  const handleAuctionLifecycle = async (action) => {
    const lifecycleActions = {
      start: startAuction,
      resume: resumeAuction,
    };

    const actionFunction = lifecycleActions[action];

    if (!actionFunction) {
      setError("Unsupported auction action.");
      return;
    }

    const confirmationMessage =
      action === "start"
        ? "Start this auction now? Its status will change to LIVE."
        : "Resume this auction and continue live bidding?";

    if (!window.confirm(confirmationMessage)) return;

    try {
      setActionLoading(`auction-${action}`);
      setError("");
      setSuccessMessage("");

      await actionFunction(auctionId);

      // Verify the status using a fresh response from the backend.
      const updatedAuction = await getAuctionById(auctionId);
      setAuction(updatedAuction);

      const updatedStatus = String(updatedAuction?.status || "").toUpperCase();

      if (updatedStatus === "LIVE") {
        setSuccessMessage("Auction is now LIVE. Opening the bidding room...");
        navigate(`/live-auction/${auctionId}`);
        return;
      }

      setSuccessMessage(
        `The ${action} request was processed. Current status: ${updatedStatus || "UNKNOWN"}.`
      );
    } catch (err) {
      console.error(`Unable to ${action} auction:`, err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        `Unable to ${action} auction.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // REGISTRATION STATISTICS
  // ==========================================

  const getStatusCount = (items, status) =>
    items.filter(
      (item) =>
        item.status?.toUpperCase() === status
    ).length;

  const pendingPlayers = getStatusCount(
    registrations,
    "PENDING"
  );

  const approvedPlayers = getStatusCount(
    registrations,
    "APPROVED"
  );

  const rejectedPlayers = getStatusCount(
    registrations,
    "REJECTED"
  );

  const pendingOwners = getStatusCount(
    ownerRegistrations,
    "PENDING"
  );

  const approvedOwners = getStatusCount(
    ownerRegistrations,
    "APPROVED"
  );

  const rejectedOwners = getStatusCount(
    ownerRegistrations,
    "REJECTED"
  );

  // ==========================================
  // PLAYER APPROVAL / REJECTION
  // ==========================================

  const handlePlayerAction = async (playerId, action) => {
    if (playerId === null || playerId === undefined || playerId === "") {
      setError("Cannot process this player: the registration ID is missing from the backend response.");
      return;
    }

    const key = `player-${playerId}`;

    try {
      setActionLoading(key);
      setError("");
      setSuccessMessage("");

      // Send the approval/rejection request to the backend.
      const actionResponse =
        action === "approve"
          ? await approvePlayerRegistration(auctionId, playerId)
          : await rejectPlayerRegistration(auctionId, playerId);

      console.log("Player registration action response:", actionResponse);

      // Refresh only the player registration list. Do not reload the
      // entire Auction Management page or show its full-page loader.
      const playerResponse = await getPlayerRegistrations(auctionId);
      setRegistrations(Array.isArray(playerResponse) ? playerResponse : []);

      setSuccessMessage(
        `Player registration ${action === "approve" ? "approved" : "rejected"} successfully.`
      );

    } catch (err) {
      console.error("Player registration action failed:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        `Unable to ${action} player registration.`
      );

    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // TEAM OWNER APPROVAL / REJECTION
  // ==========================================

  const handleOwnerAction = async (
    registrationId,
    action
  ) => {
    if (registrationId === null || registrationId === undefined || registrationId === "") {
      setError("Cannot process this team owner: the registration ID is missing from the backend response.");
      return;
    }

    const key = `owner-${registrationId}`;

    try {
      setActionLoading(key);
      setError("");
      setSuccessMessage("");

      // Send the approval/rejection request to the backend.
      const actionResponse =
        action === "approve"
          ? await approveTeamOwnerRegistration(auctionId, registrationId)
          : await rejectTeamOwnerRegistration(auctionId, registrationId);

      console.log("Team owner registration action response:", actionResponse);

      // Refresh only the team-owner list. Keep the rest of the page in place.
      const ownerResponse = await getTeamOwnerRegistrations(auctionId);
      setOwnerRegistrations(Array.isArray(ownerResponse) ? ownerResponse : []);

      setSuccessMessage(
        `Team owner registration ${action === "approve" ? "approved" : "rejected"} successfully.`
      );

    } catch (err) {
      console.error("Team owner action failed:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message ||
        `Unable to ${action} team owner registration.`
      );

    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // COPY REGISTRATION LINK
  // ==========================================

  const copyRegistrationLink = async (link, label) => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);

      setCopyMessage(
        `${label} registration link copied!`
      );

    } catch {
      setCopyMessage(
        "Copy was blocked by your browser. Select the link and copy it manually."
      );
    }
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-blue-700">
            Loading auction management...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR / AUCTION NOT FOUND
  // ==========================================

  if (!auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Auction Not Found
          </h1>

          <p className="mt-3 text-gray-600">
            {error || "This auction could not be found."}
          </p>

          <Link
            to="/dashboard"
            className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // AUCTION READINESS
  // ==========================================

  const requiredTeams = Number(auction.numberOfTeams);
  const teamBudget = Number(auction.teamBudget);
  const bidIncrement = Number(auction.bidIncrement);
  const bidTimer = Number(auction.bidTimer);

  const readinessChecks = [
    {
      label: "Auction details",
      ready: Boolean(
        auction.auctionName?.trim() && auction.category
      ),
      detail: "Auction name and category must be provided.",
      action: null,
    },
    {
      label: "Team configuration and budget",
      ready:
        Number.isFinite(requiredTeams) &&
        requiredTeams > 0 &&
        Number.isFinite(teamBudget) &&
        teamBudget > 0,
      detail:
        "Set a valid number of teams and a budget greater than zero for each team.",
      action: null,
    },
    {
      label: "Approved team owners",
      ready:
        Number.isFinite(requiredTeams) &&
        requiredTeams > 0 &&
        approvedOwners >= requiredTeams,
      detail: `${approvedOwners} approved team owner(s) out of ${requiredTeams} required team(s).`,
      action: {
        label: "Manage team owners",
        to: `/auction-management/${auction.id}/owners`,
      },
    },
    {
      label: "Approved players",
      ready: approvedPlayers > 0,
      detail: `${approvedPlayers} approved player(s) available for the auction. At least one approved player is required.`,
      action: {
        label: "Manage players",
        to: `/auction-management/${auction.id}/players`,
      },
    },
    {
      label: "Bidding rules",
      ready:
        Number.isFinite(bidIncrement) &&
        bidIncrement > 0 &&
        Number.isFinite(bidTimer) &&
        bidTimer > 0,
      detail:
        "Configure a bid increment and bid timer, both greater than zero.",
      action: null,
    },
    {
      label: "Registration options",
      ready: Boolean(
        auction.teamRegistration ||
        auction.playerRegistration
      ),
      detail:
        "Enable at least one registration type for this auction.",
      action: null,
    },
    {
      label: "Auction status",
      ready:
        auction.status?.toUpperCase() === "UPCOMING",
      detail: `Current status: ${auction.status}. Readiness is checked before the auction starts.`,
      action: null,
    },
  ];

  const readyCheckCount = readinessChecks.filter(
    (check) => check.ready
  ).length;

  const isAuctionReady = readinessChecks.every(
    (check) => check.ready
  );

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">

      <div className="mx-auto max-w-5xl">

        {/* BACK NAVIGATION */}

        <div className="flex flex-wrap items-center justify-between gap-3">

          <Link
            to="/dashboard"
            className="font-semibold text-blue-700 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={loadAuctionData}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            ↻ Refresh Data
          </button>

        </div>

        {/* GLOBAL MESSAGES */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* AUCTION HEADER */}

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          <p className="font-semibold uppercase tracking-wide text-blue-700">
            PitchBid · Auction Management
          </p>

          <h1 className="mt-2 text-3xl font-bold text-blue-950">
            {auction.auctionName || "Untitled Auction"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Auction ID: {auction.id}
          </p>

          <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            {auction.status}
          </span>

        </section>

        {/* CONFIGURATION AND PLAYER REGISTRATIONS */}

        <section className="mt-6 grid gap-5 sm:grid-cols-2">

          {/* AUCTION CONFIGURATION */}

          <div className="rounded-2xl border border-blue-100 bg-white p-6">

            <h2 className="text-xl font-bold text-gray-900">
              Auction Configuration
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              Category: {auction.category || "Not specified"}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Teams: {auction.numberOfTeams}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Budget per team:{" "}
              ₹{Number(auction.teamBudget).toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Bid increment:{" "}
              ₹{Number(auction.bidIncrement).toLocaleString("en-IN")}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Bid timer: {auction.bidTimer} seconds
            </p>

            <Link
              to={`/auction/${auction.id}`}
              className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              View Full Details
            </Link>

          </div>

          {/* PLAYER STATISTICS */}

          <div className="rounded-2xl border border-blue-100 bg-white p-6">

            <h2 className="text-xl font-bold text-gray-900">
              Player Registrations
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review registered players and manage their
              approval status before the live auction begins.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">

              <StatCard
                label="Total Players"
                value={registrations.length}
                style="blue"
              />

              <StatCard
                label="Pending Approval"
                value={pendingPlayers}
                style="amber"
              />

              <StatCard
                label="Approved"
                value={approvedPlayers}
                style="green"
              />

              <StatCard
                label="Rejected"
                value={rejectedPlayers}
                style="gray"
              />

            </div>

            {auction.playerRegistration && (
              <RegistrationLink
                link={`${window.location.origin}/join-auction/${auction.id}?role=player`}
                label="Player"
                onCopy={copyRegistrationLink}
              />
            )}

          </div>

        </section>

        {/* TEAM OWNER REGISTRATIONS */}

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 sm:p-8">

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Team Management
          </p>

          <h2 className="mt-2 text-2xl font-bold text-blue-950">
            Team Owner Registrations
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Review team details, verify the owner, and manage
            team registration approvals for this auction.
            Each owner is automatically registered as Player #1.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <StatCard
              label="Total Teams"
              value={ownerRegistrations.length}
              style="blue"
            />

            <StatCard
              label="Pending"
              value={pendingOwners}
              style="amber"
            />

            <StatCard
              label="Approved"
              value={approvedOwners}
              style="green"
            />

            <StatCard
              label="Rejected"
              value={rejectedOwners}
              style="gray"
            />

          </div>

          <Link
            to={`/auction-management/${auction.id}/owners`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Manage Team Owner Registrations
          </Link>

          {/* Open the Team Management page */}
          <Link
            to={`/auction-management/${auctionId}/teams`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Teams
          </Link>

          {/* Open the eligible Player Management page */}
          <Link
            to={`/auction-management/${auctionId}/players`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Players
          </Link>

          {auction.teamRegistration && (
            <RegistrationLink
              link={`${window.location.origin}/join-auction/${auction.id}?role=owner`}
              label="Team Owner"
              onCopy={copyRegistrationLink}
            />
          )}

          {copyMessage && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700"
            >
              {copyMessage}
            </p>
          )}

        </section>

        {/* REGISTRATION OVERVIEW */}

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 sm:p-8">

          <h2 className="text-2xl font-bold text-blue-950">
            Registration Overview
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Registration information retrieved from the backend.
          </p>

          {/* PLAYER REGISTRATION TABLE */}

          <h3 className="mb-3 mt-6 font-bold text-gray-900">
            Individual Players
          </h3>

          {registrations.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No individual player registrations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="bg-blue-50 text-blue-950">
                  <tr>
                    <th className="p-3">Player</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {registrations.map((player) => (
                    <tr
                      key={getPlayerRegistrationId(player)}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3 font-medium">
                        {player.fullName}
                      </td>

                      <td className="p-3">
                        {player.email}
                      </td>

                      <td className="p-3">
                        {player.playerRole}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={player.status} />
                      </td>

                      <td className="p-3">
                        {player.status?.toUpperCase() === "PENDING" ? (
                          <div className="flex gap-2">

                            <button
                              type="button"
                              disabled={actionLoading === `player-${getPlayerRegistrationId(player)}`}
                              onClick={() =>
                                handlePlayerAction(
                                  getPlayerRegistrationId(player),
                                  "approve"
                                )
                              }
                              className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === `player-${getPlayerRegistrationId(player)}`
                                ? "Please wait..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading === `player-${getPlayerRegistrationId(player)}`}
                              onClick={() =>
                                handlePlayerAction(
                                  getPlayerRegistrationId(player),
                                  "reject"
                                )
                              }
                              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === `player-${getPlayerRegistrationId(player)}` ? "Please wait..." : "Reject"}
                            </button>

                          </div>
                        ) : (
                          <span className="text-gray-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          {/* TEAM OWNER REGISTRATION TABLE */}

          <h3 className="mb-3 mt-8 font-bold text-gray-900">
            Team Owners
          </h3>

          {ownerRegistrations.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No team owner registrations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="bg-blue-50 text-blue-950">
                  <tr>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {ownerRegistrations.map((owner) => (
                    <tr
                      key={getOwnerRegistrationId(owner)}
                      className="border-b border-gray-100"
                    >
                      <td className="p-3 font-medium">
                        {owner.ownerName}
                      </td>

                      <td className="p-3">
                        {owner.ownerEmail}
                      </td>

                      <td className="p-3">
                        {owner.teamName}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={owner.status} />
                      </td>

                      <td className="p-3">
                        {owner.status?.toUpperCase() === "PENDING" ? (
                          <div className="flex gap-2">

                            <button
                              type="button"
                              disabled={actionLoading === `owner-${getOwnerRegistrationId(owner)}`}
                              onClick={() =>
                                handleOwnerAction(
                                  getOwnerRegistrationId(owner),
                                  "approve"
                                )
                              }
                              className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === `owner-${getOwnerRegistrationId(owner)}`
                                ? "Please wait..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              disabled={actionLoading === `owner-${getOwnerRegistrationId(owner)}`}
                              onClick={() =>
                                handleOwnerAction(
                                  getOwnerRegistrationId(owner),
                                  "reject"
                                )
                              }
                              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {actionLoading === `owner-${getOwnerRegistrationId(owner)}` ? "Please wait..." : "Reject"}
                            </button>

                          </div>
                        ) : (
                          <span className="text-gray-400">
                            No action
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* AUCTION READINESS CHECKLIST */}

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Pre-auction checklist
              </p>

              <h2 className="mt-2 text-2xl font-bold text-blue-950">
                Auction Readiness
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Review these requirements before starting the live auction.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-bold ${
                isAuctionReady
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isAuctionReady ? "Ready to Start" : "Not Ready Yet"}
            </span>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${
                  (readyCheckCount / readinessChecks.length) * 100
                }%`,
              }}
            />

          </div>

          <p className="mt-2 text-sm text-gray-600">
            {readyCheckCount} of {readinessChecks.length} checks completed
          </p>

          <div className="mt-5 space-y-3">

            {readinessChecks.map((check) => (
              <div
                key={check.label}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  check.ready
                    ? "border-green-100 bg-green-50"
                    : "border-amber-100 bg-amber-50"
                }`}
              >

                <div className="flex items-start gap-3">

                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      check.ready
                        ? "bg-green-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {check.ready ? "✓" : "!"}
                  </span>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {check.label}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {check.detail}
                    </p>
                  </div>

                </div>

                <div className="flex flex-wrap items-center gap-3 pl-9 sm:pl-0">

                  <span
                    className={`text-sm font-semibold ${
                      check.ready
                        ? "text-green-700"
                        : "text-amber-700"
                    }`}
                  >
                    {check.ready ? "Complete" : "Action Required"}
                  </span>

                  {!check.ready && check.action && (
                    <Link
                      to={check.action.to}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {check.action.label} →
                    </Link>
                  )}

                </div>

              </div>
            ))}

          </div>

          <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            This checklist is an informational frontend check.
            It does not start or lock the auction. The backend
            remains responsible for enforcing auction rules.
          </p>

        </section>

        {/* AUCTION CONTROL ROOM */}

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Auction Control Room
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-blue-950">
              Auction Lifecycle
            </h2>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">
              {auction.status || "UNKNOWN"}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Start the auction only after completing the readiness checklist.
            Once the backend confirms the auction is LIVE, you can enter the
            live bidding room.
          </p>

          {String(auction.status || "").toUpperCase() === "UPCOMING" && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-bold text-blue-950">Ready to begin?</h3>
              <p className="mt-1 text-sm text-gray-600">
                {isAuctionReady
                  ? "All frontend readiness checks are complete."
                  : "Complete the readiness checklist above before starting."}
              </p>
              <button
                type="button"
                onClick={() => handleAuctionLifecycle("start")}
                disabled={!isAuctionReady || actionLoading !== null}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 sm:w-auto"
              >
                {actionLoading === "auction-start"
                  ? "Starting Auction..."
                  : isAuctionReady
                  ? "Start Auction →"
                  : "Complete Checklist First"}
              </button>
            </div>
          )}

          {String(auction.status || "").toUpperCase() === "LIVE" && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
              <h3 className="font-bold text-green-900">Auction is LIVE</h3>
              <p className="mt-1 text-sm text-green-800">
                The backend has confirmed that this auction is live. You can
                now open the live bidding room.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/live-auction/${auction.id}`)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800 sm:w-auto"
              >
                Open Live Auction →
              </button>
            </div>
          )}

          {String(auction.status || "").toUpperCase() === "PAUSED" && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="font-bold text-amber-900">Auction is PAUSED</h3>
              <p className="mt-1 text-sm text-amber-800">
                Resume the auction to continue live bidding.
              </p>
              <button
                type="button"
                onClick={() => handleAuctionLifecycle("resume")}
                disabled={actionLoading !== null}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:w-auto"
              >
                {actionLoading === "auction-resume"
                  ? "Resuming Auction..."
                  : "Resume Auction →"}
              </button>
            </div>
          )}

          {["COMPLETED", "STOPPED"].includes(
            String(auction.status || "").toUpperCase()
          ) && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-bold text-gray-900">
                Auction {String(auction.status).toLowerCase()}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                This auction is no longer available for live bidding.
              </p>
            </div>
          )}

          {actionLoading?.startsWith("auction-") && (
            <p className="mt-3 text-sm text-blue-700" role="status">
              Updating auction status...
            </p>
          )}
        </section>

      </div>
    </main>
  );
}

// ==========================================
// REUSABLE STATISTICS CARD
// ==========================================

function StatCard({ label, value, style }) {
  const styles = {
    blue: "bg-blue-50 text-blue-900",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`rounded-xl p-4 ${styles[style]}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ==========================================
// REGISTRATION STATUS BADGE
// ==========================================

function StatusBadge({ status }) {
  const normalized = status?.toUpperCase();

  const styles = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] || "bg-gray-100 text-gray-700"
      }`}
    >
      {normalized || "UNKNOWN"}
    </span>
  );
}

// ==========================================
// REGISTRATION LINK COMPONENT
// ==========================================

function RegistrationLink({ link, label, onCopy }) {
  return (
    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

      <p className="text-sm font-semibold text-blue-950">
        Share {label} Registration
      </p>

      <input
        readOnly
        value={link}
        onFocus={(event) => event.target.select()}
        className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700"
      />

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">

        <button
          type="button"
          onClick={() => onCopy(link, label)}
          className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Copy {label} Link
        </button>

        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Preview Link
        </a>

      </div>

    </div>
  );
}

export default AuctionManagement;

