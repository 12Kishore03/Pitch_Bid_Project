
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAuctionById } from "../api/auctionApi";
import { getAuctionPlayers } from "../api/playerApi";

const PLAYER_ROLES = [
  "BATSMAN",
  "BOWLER",
  "ALL_ROUNDER",
  "WICKET_KEEPER",
];

// API role values may arrive as "Batsman", "BATSMAN",
// "All-rounder", or "ALL_ROUNDER". Normalize all supported forms.
const normalizeRole = (role) => {
  const value = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const roleMap = {
    batsman: "BATSMAN",
    bowler: "BOWLER",
    all_rounder: "ALL_ROUNDER",
    allrounder: "ALL_ROUNDER",
    wicket_keeper: "WICKET_KEEPER",
    wicketkeeper: "WICKET_KEEPER",
  };

  return roleMap[value] || value.toUpperCase();
};

const formatRole = (role) => {
  const labels = {
    BATSMAN: "Batsman",
    BOWLER: "Bowler",
    ALL_ROUNDER: "All-rounder",
    WICKET_KEEPER: "Wicket Keeper",
  };

  return labels[normalizeRole(role)] || role || "Not specified";
};

function PlayerManagement() {
  const { auctionId } = useParams();

  const [auction, setAuction] = useState(null);
  const [players, setPlayers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeRole, setActiveRole] = useState("ALL");

  // --------------------------------------------------
  // LOAD AUCTION AND ELIGIBLE PLAYERS
  // --------------------------------------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [auctionData, playerData] = await Promise.all([
        getAuctionById(auctionId),
        getAuctionPlayers(auctionId),
      ]);

      setAuction(auctionData);

      setPlayers(
        Array.isArray(playerData) ? playerData : []
      );
    } catch (err) {
      console.error("Unable to load player management:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Unable to load players. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --------------------------------------------------
  // FORMAT HELPERS
  // --------------------------------------------------

  const formatPrice = (price) => {
    if (price === null || price === undefined) {
      return "Not specified";
    }

    const amount = Number(price);

    return Number.isFinite(amount)
      ? `₹${amount.toLocaleString("en-IN")}`
      : "Not specified";
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const roleCounts = useMemo(() => {
    const counts = {
      ALL: players.length,
      BATSMAN: 0,
      BOWLER: 0,
      ALL_ROUNDER: 0,
      WICKET_KEEPER: 0,
    };

    players.forEach((player) => {
      const role = normalizeRole(player.playerRole);

      if (Object.prototype.hasOwnProperty.call(counts, role)) {
        counts[role] += 1;
      }
    });

    return counts;
  }, [players]);

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filteredPlayers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return players.filter((player) => {
      const playerRole = normalizeRole(player.playerRole);
      const matchesRole =
        activeRole === "ALL" || playerRole === activeRole;

      const searchableValues = [
        player.fullName,
        player.email,
        player.phone,
        player.city,
        player.playerRole,
        player.battingStyle,
        player.bowlingStyle,
      ];

      const matchesSearch =
        query === "" ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return matchesRole && matchesSearch;
    });
  }, [players, searchTerm, activeRole]);

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 font-semibold text-blue-950">
            Loading Player Management...
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* BACK NAVIGATION */}

        <Link
          to={`/auction-management/${auctionId}`}
          className="font-semibold text-blue-700 hover:underline"
        >
          ← Back to Auction Management
        </Link>

        {/* HEADER */}

        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            PitchBid · Creator Dashboard
          </p>

          <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">
                Player Management
              </h1>

              <p className="mt-2 text-gray-600">
                {auction?.auctionName || "Auction"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Auction ID: {auctionId}
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Auction: {auction?.status || "Unknown"}
            </span>
          </div>
        </section>

        {/* ERROR AND SUCCESS */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}



        {/* PLAYER STATISTICS */}

        <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">

          {[
            {
              label: "Eligible Players",
              value: roleCounts.ALL,
            },
            {
              label: "Batsmen",
              value: roleCounts.BATSMAN,
            },
            {
              label: "Bowlers",
              value: roleCounts.BOWLER,
            },
            {
              label: "All-rounders",
              value: roleCounts.ALL_ROUNDER,
            },
            {
              label: "Wicket Keepers",
              value: roleCounts.WICKET_KEEPER,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {item.label}
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-950">
                {item.value}
              </p>
            </div>
          ))}

        </section>

        {/* SEARCH AND FILTER */}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search by player name, email, phone or city..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={activeRole}
              onChange={(event) =>
                setActiveRole(event.target.value)
              }
              className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="ALL">All Playing Roles</option>
              <option value="BATSMAN">Batsmen</option>
              <option value="BOWLER">Bowlers</option>
              <option value="ALL_ROUNDER">All-rounders</option>
              <option value="WICKET_KEEPER">Wicket Keepers</option>
            </select>

            <button
              type="button"
              onClick={loadData}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Refresh
            </button>

          </div>
        </section>

        {/* PLAYER LIST */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-2 border-b border-blue-100 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-blue-950">
                Eligible Auction Players
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredPlayers.length} player
                {filteredPlayers.length !== 1 ? "s" : ""} shown
              </p>
            </div>

            <span className="text-xs text-gray-500">
              Approved individual registrations only
            </span>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No eligible players found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Approved individual players with a valid base
                price will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {filteredPlayers.map((player) => (
                <article
                  key={player.id}
                  className="p-5 transition hover:bg-blue-50/40 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* PLAYER INFORMATION */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-blue-950">
                          {player.fullName}
                        </h3>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {player.status}
                        </span>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {formatRole(player.playerRole)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">

                        <p>
                          <strong className="text-gray-800">Email:</strong>{" "}
                          {player.email || "Not provided"}
                        </p>

                        <p>
                          <strong className="text-gray-800">Phone:</strong>{" "}
                          {player.phone || "Not provided"}
                        </p>

                        <p>
                          <strong className="text-gray-800">City:</strong>{" "}
                          {player.city || "Not provided"}
                        </p>

                        <p>
                          <strong className="text-gray-800">Batting:</strong>{" "}
                          {player.battingStyle || "Not specified"}
                        </p>

                        <p>
                          <strong className="text-gray-800">Bowling:</strong>{" "}
                          {player.bowlingStyle || "Not specified"}
                        </p>

                        <p>
                          <strong className="text-gray-800">Wicketkeeper:</strong>{" "}
                          {player.wicketkeeper ? "Yes" : "No"}
                        </p>

                        <p>
                          <strong className="text-gray-800">Base Price:</strong>{" "}
                          <span className="font-bold text-blue-700">
                            {formatPrice(player.basePrice)}
                          </span>
                        </p>

                        <p>
                          <strong className="text-gray-800">Registration:</strong>{" "}
                          {player.registrationType}
                        </p>

                        <p>
                          <strong className="text-gray-800">Registered:</strong>{" "}
                          {player.registeredAt
                            ? new Date(player.registeredAt).toLocaleDateString("en-IN")
                            : "Not available"}
                        </p>

                      </div>
                    </div>


                  </div>
                </article>
              ))}

            </div>
          )}
        </section>


      </div>
    </main>
  );
}

export default PlayerManagement;
