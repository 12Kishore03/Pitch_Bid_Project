
import { Link, useParams } from "react-router-dom";
import { getAuctionById } from "../utils/AuctionStroage";
import { getRegistrationsByAuction } from "../utils/RegistrationStorage";

function AuctionManagement() {
  const { auctionId } = useParams();
  const auction = getAuctionById(auctionId);

  // Get registrations belonging to this auction only.
  const registrations = getRegistrationsByAuction(auctionId);

  const pendingPlayers = registrations.filter(
    (player) => player.status === "Pending Approval"
  ).length;

  const approvedPlayers = registrations.filter(
    (player) => player.status === "Approved"
  ).length;

  const rejectedPlayers = registrations.filter(
    (player) => player.status === "Rejected"
  ).length;

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

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="font-semibold text-blue-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Auction header */}
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
            {auction.status || "Upcoming"}
          </span>
        </section>

        {/* Auction configuration and registrations */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2">
          {/* Auction configuration */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Auction Configuration
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              Category: {auction.category || "Not specified"}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Teams: {auction.numberOfTeams || "Not specified"}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Budget per team:{" "}
              {auction.teamBudget != null && auction.teamBudget !== ""
                ? `₹${Number(auction.teamBudget).toLocaleString("en-IN")}`
                : "Not specified"}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Bid increment:{" "}
              {auction.bidIncrement != null && auction.bidIncrement !== ""
                ? `₹${Number(auction.bidIncrement).toLocaleString("en-IN")}`
                : "Not specified"}
            </p>

            <Link
              to={`/auction/${auction.id}`}
              className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              View Full Details
            </Link>
          </div>

          {/* Player registrations */}
          <div className="rounded-2xl border border-blue-100 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">
              Player Registrations
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review registered players and manage their approval status
              before the live auction begins.
            </p>

            {/* Registration statistics */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {registrations.length}
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-sm text-gray-600">
                  Pending Approval
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {pendingPlayers}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {approvedPlayers}
                </p>
              </div>

              <div className="rounded-xl bg-gray-100 p-4">
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="mt-1 text-2xl font-bold text-gray-700">
                  {rejectedPlayers}
                </p>
              </div>
            </div>

            {/* Open player registrations page */}
            <Link
              to={`/auction-management/${auction.id}/players`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Player Registrations
            </Link>

            {/* Player registration link */}
            {auction.registrationLinks?.player && (
              <a
                href={auction.registrationLinks.player}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block break-all text-sm font-semibold text-blue-700 hover:underline"
              >
                Open Player Registration Link
              </a>
            )}

            {/* Team owner registration link */}
            {auction.registrationLinks?.owner && (
              <a
                href={auction.registrationLinks.owner}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block break-all text-sm font-semibold text-blue-700 hover:underline"
              >
                Open Team Owner Registration Link
              </a>
            )}
          </div>
        </section>

        {/* Live auction preview */}
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">
            Live Auction
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Live bidding, the bid timer, and start, pause, and stop
            controls will be implemented in the next stage.
          </p>
        </section>
      </div>
    </main>
  );
}

export default AuctionManagement;
