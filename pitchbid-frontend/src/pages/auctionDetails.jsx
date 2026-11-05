
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAuctionById } from "../api/auctionApi";
import { formatCurrency, formatDate } from "../utils/FormatDate";

function AuctionDetails() {
  const { auctionId } = useParams();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedLink, setCopiedLink] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAuction = async () => {
      try {
        setLoading(true);
        setError("");

        if (!auctionId || !/^\d+$/.test(auctionId)) {
          throw new Error("Invalid auction ID.");
        }

        const data = await getAuctionById(auctionId);

        if (isMounted) {
          setAuction(data);
        }
      } catch (err) {
        console.error("Failed to load auction:", err);
        console.error("Backend response:", err.response?.data);

        if (isMounted) {
          setError(
            err.response?.data?.message ||
            err.response?.data?.detail ||
            err.message ||
            "Unable to load auction details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAuction();

    return () => {
      isMounted = false;
    };
  }, [auctionId]);

  const copyLink = async (url, type) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(type);

      setTimeout(() => {
        setCopiedLink("");
      }, 2000);
    } catch (err) {
      console.error("Unable to copy link:", err);
      alert("Unable to copy the link. Please copy it manually.");
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not specified";
    }

    return value;
  };

  // Generate registration links dynamically.
  // These use the same JoinAuction route as your existing registration flow.
  const playerRegistrationLink =
    `${window.location.origin}/join-auction/${auctionId}?role=player`;

  const ownerRegistrationLink =
    `${window.location.origin}/join-auction/${auctionId}?role=owner`;

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 font-semibold text-blue-950">
            Loading auction details...
          </p>
        </div>
      </main>
    );
  }

  if (error || !auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Unable to Load Auction
          </h1>

          <p className="mt-3 text-red-600">
            {error || "Auction not found."}
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const details = [
    ["Auction ID", auction.id ?? auctionId],
    ["Category", auction.category],
    ["Visibility", auction.visibility],
    ["Description", auction.description],
    ["Number of teams", auction.numberOfTeams],
    ["Budget per team", auction.teamBudget != null
      ? formatCurrency(auction.teamBudget)
      : null],
    ["Minimum players per team", auction.minPlayers],
    ["Maximum players per team", auction.maxPlayers],
    ["Maximum auction players", auction.maxAuctionPlayers],
    ["Fixed bid increment", auction.bidIncrement != null
      ? formatCurrency(auction.bidIncrement)
      : null],
    ["Bid timer", auction.bidTimer != null
      ? `${auction.bidTimer} seconds`
      : null],
    ["Registration deadline", auction.registrationDeadline
      ? formatDate(auction.registrationDeadline, true)
      : null],
    ["Auction starts", auction.startDate
      ? formatDate(auction.startDate, true)
      : null],
    ["Planned end", auction.endDate
      ? formatDate(auction.endDate, true)
      : null],
  ];

  const status = auction.status || "UPCOMING";

  const statusStyle =
    status === "LIVE"
      ? "bg-green-100 text-green-700"
      : status === "COMPLETED"
      ? "bg-gray-100 text-gray-700"
      : status === "PAUSED"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Back navigation */}
        <Link
          to="/dashboard"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to Dashboard
        </Link>

        {/* Auction details */}
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
                Auction ID: {auction.id ?? auctionId}
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle}`}
            >
              {status}
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
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Registration links */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-bold text-blue-950">
            Registration Links
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Share these links with participants to register for this auction.
          </p>

          {/* Player registration */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Player Registration
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={playerRegistrationLink}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm"
              />

              <button
                type="button"
                onClick={() =>
                  copyLink(playerRegistrationLink, "player")
                }
                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {copiedLink === "player" ? "Copied!" : "Copy Player Link"}
              </button>

              <a
                href={playerRegistrationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50"
              >
                Preview
              </a>
            </div>
          </div>

          {/* Team owner registration */}
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Team Owner Registration
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={ownerRegistrationLink}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm"
              />

              <button
                type="button"
                onClick={() =>
                  copyLink(ownerRegistrationLink, "owner")
                }
                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {copiedLink === "owner" ? "Copied!" : "Copy Owner Link"}
              </button>

              <a
                href={ownerRegistrationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-blue-600 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50"
              >
                Preview
              </a>
            </div>
          </div>

          {/* Navigation actions */}
          <div className="mt-8 flex flex-wrap gap-3">

            {/* {status === "UPCOMING" && (
              <Link
                to={`/edit-auction/${auction.id ?? auctionId}`}
                className="rounded-lg border border-blue-600 px-5 py-3 font-semibold text-blue-700 hover:bg-blue-50"
              >
                Edit Auction
              </Link>
            )} */}

            <Link
              to={`/auction-management/${auction.id ?? auctionId}`}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Manage Auction
            </Link>

            <Link
              to="/dashboard"
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuctionDetails;
