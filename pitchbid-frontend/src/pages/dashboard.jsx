
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMyAuctions } from "../api/auctionApi";

function formatDate(value, includeTime = false) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      : {}),
  }).format(date);
}

function formatCurrency(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "Not specified";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getStatusStyle(status) {
  switch (status) {
    case "LIVE":
      return "bg-green-100 text-green-700";

    case "COMPLETED":
      return "bg-gray-100 text-gray-700";

    case "PAUSED":
      return "bg-yellow-100 text-yellow-700";

    case "UPCOMING":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch auctions from Spring Boot
  const fetchAuctions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyAuctions();

      // Backend returns a direct JSON array
      setAuctions(Array.isArray(response) ? response : []);

    } catch (err) {
      console.error("Failed to fetch auctions:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load your auctions. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold"
          >
            Pitch<span className="text-blue-600">Bid</span>
          </button>

          <div className="flex items-center gap-5">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700"
            >
              Logout
            </button>

          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">

        {/* Welcome Section */}
        <section className="mb-10">

          <p className="font-semibold text-blue-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
            Welcome, {user?.name || "User"} 👋
          </h1>

          <p className="mt-3 text-gray-600">
            Create and manage your cricket auctions with PitchBid.
          </p>

        </section>

        {/* Dashboard Action Cards */}
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">

          {/* Create Auction */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 transition hover:shadow-xl">

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
              <span className="text-3xl font-bold text-blue-600">
                +
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Create an Auction
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Set up your cricket auction, configure team budgets
              and bidding rules, and prepare registration for
              players and team owners.
            </p>

            <button
              type="button"
              onClick={() => navigate("/create-auction")}
              className="mt-7 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Create Auction
            </button>

          </div>

          {/* Auction Management */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8">

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white">
              <span className="text-2xl text-blue-600">⚙</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Auction Management
            </h2>

            <p className="mt-3 leading-6 text-gray-600">
              Open an auction to review its configuration and
              manage registrations and live bidding.
            </p>

            {auctions.length > 0 && (
              <div className="mt-5">

                <label
                  htmlFor="manageAuction"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Select an auction
                </label>

                <select
                  id="manageAuction"
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) {
                      navigate(
                        `/auction-management/${event.target.value}`
                      );
                    }
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="" disabled>
                    Choose an auction
                  </option>

                  {auctions.map((auction) => (
                    <option key={auction.id} value={auction.id}>
                      {auction.auctionName}
                    </option>
                  ))}

                </select>

              </div>
            )}

            {auctions.length === 0 && !loading && (
              <p className="mt-6 text-sm font-medium text-blue-700">
                Available after you create an auction.
              </p>
            )}

          </div>

        </section>

        {/* My Auctions */}
        <section className="mt-12">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                My Auctions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View and manage your created auctions.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchAuctions}
              disabled={loading}
              className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">

              <p className="font-medium text-gray-600">
                Loading your auctions...
              </p>

            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-5"
            >

              <p className="text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchAuctions}
                className="mt-3 font-semibold text-red-700 underline"
              >
                Try Again
              </button>

            </div>
          )}

          {/* Empty State */}
          {!loading && !error && auctions.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">

              <div className="text-4xl">🏏</div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No auctions yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Create your first auction to see it listed here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/create-auction")}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Create Your First Auction
              </button>

            </div>
          )}

          {/* Auction Cards */}
          {!loading && !error && auctions.length > 0 && (

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {auctions.map((auction) => (

                <article
                  key={auction.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <h3 className="break-words text-xl font-bold text-gray-900">
                        {auction.auctionName || "Untitled Auction"}
                      </h3>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        ID: {auction.id}
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(auction.status)}`}
                    >
                      {auction.status}
                    </span>

                  </div>

                  {/* Auction Information */}
                  <div className="mt-5 space-y-3 text-sm text-gray-600">

                    <p>
                      <strong>Category:</strong>{" "}
                      {auction.category || "Not specified"}
                    </p>

                    <p>
                      <strong>Visibility:</strong>{" "}
                      {auction.visibility || "Not specified"}
                    </p>

                    <p>
                      <strong>Teams:</strong>{" "}
                      {auction.numberOfTeams ?? "Not specified"}
                    </p>

                    <p>
                      <strong>Budget per team:</strong>{" "}
                      {formatCurrency(auction.teamBudget)}
                    </p>

                    <p>
                      <strong>Bid increment:</strong>{" "}
                      {formatCurrency(auction.bidIncrement)}
                    </p>

                    <p>
                      <strong>Registration deadline:</strong>{" "}
                      {formatDate(auction.registrationDeadline, true)}
                    </p>

                    <p>
                      <strong>Auction starts:</strong>{" "}
                      {formatDate(auction.startDate, true)}
                    </p>

                    <p>
                      <strong>Auction ends:</strong>{" "}
                      {formatDate(auction.endDate, true)}
                    </p>

                  </div>

                  {/* Actions */}
                  <div className="mt-5 border-t border-gray-100 pt-4">

                    <div className="flex flex-wrap gap-2">

                      <Link
                        to={`/auction/${auction.id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Auction
                      </Link>

                      <Link
                        to={`/auction-management/${auction.id}`}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                      >
                        Manage
                      </Link>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
