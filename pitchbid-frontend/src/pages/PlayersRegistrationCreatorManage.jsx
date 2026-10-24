
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAuctionById } from "../utils/AuctionStroage";
import {
  getRegistrationsByAuction,
  updateRegistrationStatus,
} from "../utils/RegistrationStorage";

function PlayersRegistrationsCreatorManage() {
  const { auctionId } = useParams();

  const auction = getAuctionById(auctionId);

  const [registrations, setRegistrations] = useState(() =>
    getRegistrationsByAuction(auctionId)
  );

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  const refreshRegistrations = () => {
    setRegistrations(getRegistrationsByAuction(auctionId));
  };

  const counts = useMemo(
    () => ({
      All: registrations.length,
      "Pending Approval": registrations.filter(
        (player) => player.status === "Pending Approval"
      ).length,
      Approved: registrations.filter(
        (player) => player.status === "Approved"
      ).length,
      Rejected: registrations.filter(
        (player) => player.status === "Rejected"
      ).length,
    }),
    [registrations]
  );

  const filteredPlayers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return registrations.filter((player) => {
      const matchesStatus =
        activeFilter === "All" || player.status === activeFilter;

      const matchesSearch = [
        player.fullName,
        player.email,
        player.phone,
        player.playerRole,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      return matchesStatus && matchesSearch;
    });
  }, [registrations, activeFilter, searchTerm]);

  const handleStatusChange = (registrationId, status) => {
    setError("");

    try {
      updateRegistrationStatus(registrationId, status);
      refreshRegistrations();
    } catch (err) {
      console.error("Unable to update registration status:", err);
      setError(err.message || "Could not update the player status.");
    }
  };

  if (!auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Auction Not Found
          </h1>
          <p className="mt-3 text-gray-600">
            This auction could not be found in browser storage.
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

  const filters = [
    "All",
    "Pending Approval",
    "Approved",
    "Rejected",
  ];

  const formatPrice = (price) => {
    const amount = Number(price);

    return Number.isFinite(amount)
      ? `₹${amount.toLocaleString("en-IN")}`
      : "Not specified";
  };

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          to={`/auction-management/${auctionId}`}
          className="font-semibold text-blue-700 hover:underline"
        >
          ← Back to Auction Management
        </Link>

        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            PitchBid · Creator Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold text-blue-950 sm:text-3xl">
            Player Registrations
          </h1>

          <p className="mt-2 text-gray-600">
            {auction.auctionName || "Untitled Auction"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Auction ID: {auction.id}
          </p>
        </section>

        {/* Registration statistics */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-xl border p-4 text-left transition ${
                activeFilter === filter
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-blue-100 bg-white text-gray-800 hover:border-blue-300"
              }`}
            >
              <span className="block text-sm">
                {filter === "All" ? "Total Players" : filter}
              </span>
              <span className="mt-2 block text-2xl font-bold">
                {counts[filter]}
              </span>
            </button>
          ))}
        </section>

        {/* Search and refresh */}
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, phone, or playing role"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={refreshRegistrations}
              className="rounded-lg border border-blue-200 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Refresh List
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </section>

        {/* Player list */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-blue-100 p-5">
            <h2 className="text-lg font-bold text-blue-950">
              Registered Players
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredPlayers.length} player
              {filteredPlayers.length !== 1 ? "s" : ""} shown
            </p>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No players found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {registrations.length === 0
                  ? "Players who register for this auction will appear here."
                  : "Try changing the status filter or search term."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPlayers.map((player) => (
                <article
                  key={player.id}
                  className="p-5 transition hover:bg-blue-50/40 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-blue-950">
                          {player.fullName || "Unnamed Player"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            player.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : player.status === "Rejected"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {player.status || "Pending Approval"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-gray-800">
                            Email:
                          </span>{" "}
                          {player.email || "Not provided"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Phone:
                          </span>{" "}
                          {player.phone || "Not provided"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Playing role:
                          </span>{" "}
                          {player.playerRole || "Not specified"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Batting style:
                          </span>{" "}
                          {player.battingStyle || "Not specified"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Bowling style:
                          </span>{" "}
                          {player.bowlingStyle || "Not specified"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Base price:
                          </span>{" "}
                          {formatPrice(player.basePrice)}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            City:
                          </span>{" "}
                          {player.city || "Not provided"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Registered:
                          </span>{" "}
                          {player.registeredAt
                            ? new Date(
                                player.registeredAt
                              ).toLocaleString("en-IN")
                            : "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {player.status !== "Approved" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(player.id, "Approved")
                          }
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                      )}

                      {player.status !== "Rejected" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(player.id, "Rejected")
                          }
                          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-5 text-xs leading-5 text-gray-500">
          This frontend currently stores registration data in this
          browser's Local Storage. It is suitable for local testing;
          server-side authorization and shared updates will require the
          backend.
        </p>
      </div>
    </main>
  );
}

export default PlayersRegistrationsCreatorManage;
