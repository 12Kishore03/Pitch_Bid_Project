
import { Link, useParams } from "react-router-dom";
import { getAuctionById } from "../utils/AuctionStroage";
import { formatCurrency , formatDate } from "../utils/FormatDate";

function AuctionDetails() {
  const { auctionId } = useParams();
  const auction = getAuctionById(auctionId);

  if (!auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Auction not found
          </h1>
          <p className="mt-3 text-gray-600">
            This auction may have been deleted or is no longer available.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const details = [
    ["Category", auction.category],
    ["Visibility", auction.visibility],
    ["Description", auction.description],
    ["Number of teams", auction.numberOfTeams],
    ["Budget per team", formatCurrency(auction.teamBudget)],
    ["Minimum players per team", auction.minPlayers],
    ["Maximum players per team", auction.maxPlayers],
    ["Maximum auction players", auction.maxAuctionPlayers],
    ["Fixed bid increment", formatCurrency(auction.bidIncrement)],
    ["Bid timer", auction.bidTimer ? `${auction.bidTimer} seconds` : null],
    ["Registration deadline", formatDate(auction.registrationDeadline, true)],
    ["Auction starts", formatDate(auction.startDate, true)],
    ["Planned end", formatDate(auction.endDate, true)],
  ];

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to Dashboard
        </Link>

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                PitchBid · Auction Details
              </p>
              <h1 className="mt-2 text-3xl font-bold text-blue-950">
                {auction.auctionName || "Untitled auction"}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Auction ID: {auction.id}
              </p>
            </div>

            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              {auction.status || "Upcoming"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 break-words font-semibold text-gray-900">
                  {value || "Not specified"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-blue-950">
            Registration Links
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Share these links with participants for this auction.
          </p>

          {[
            ["Player Registration", auction.registrationLinks?.player],
            ["Team Owner Registration", auction.registrationLinks?.owner],
          ].map(([label, url]) => (
            <div key={label} className="mt-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {label}
              </p>
              {url ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={url}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(url)}
                    className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Copy Link
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Link not available.</p>
              )}
            </div>
          ))}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/edit-auction/${auction.id}`}
              className="rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
            >
              Edit Auction
            </Link>
            <Link
              to={`/auction-management/${auction.id}`}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Manage Auction
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuctionDetails;
