
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getAuctions,
  deleteAuction,
} from "../utils/AuctionStroage";

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
  if (value === "" || value == null || !Number.isFinite(Number(value))) {
    return "Not specified";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [auctions, setAuctions] = useState(() => getAuctions());
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    const refreshAuctions = () => {
      setAuctions(getAuctions());
    };

    window.addEventListener("focus", refreshAuctions);
    window.addEventListener("storage", refreshAuctions);

    return () => {
      window.removeEventListener("focus", refreshAuctions);
      window.removeEventListener("storage", refreshAuctions);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDelete = (auction) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${auction.auctionName || "this auction"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const updatedAuctions = deleteAuction(auction.id);

      setAuctions(
        Array.isArray(updatedAuctions)
          ? updatedAuctions
          : getAuctions()
      );

      setStorageError("");
    } catch (error) {
      console.error("Failed to delete auction:", error);
      setStorageError(
        "Unable to delete the auction. Please check your browser storage."
      );
    }
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
              prepare for the live auction.
            </p>

            {auctions.length > 0 ? (
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
                      navigate(`/auction-management/${event.target.value}`);
                    }
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Choose an auction
                  </option>

                  {auctions.map((auction) => (
                    <option key={auction.id} value={auction.id}>
                      {auction.auctionName || auction.id}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-xs text-gray-500">
                  Registration review and live bidding still require
                  their respective features to be implemented.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm font-medium text-blue-700">
                Available after you create an auction.
              </p>
            )}
          </div>
        </section>

        {/* My Auctions */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              My Auctions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View, edit and manage your created auctions.
            </p>
          </div>

          {storageError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {storageError}
            </div>
          )}

          {auctions.length === 0 ? (
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
          ) : (
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

                    <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {auction.status || "Upcoming"}
                    </span>
                  </div>

                  {/* Auction Information */}
                  <div className="mt-5 space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>Category:</strong>{" "}
                      {auction.category || "Not specified"}
                    </p>

                    <p>
                      <strong>Teams:</strong>{" "}
                      {auction.numberOfTeams || "Not specified"}
                    </p>

                    <p>
                      <strong>Budget per team:</strong>{" "}
                      {formatCurrency(auction.teamBudget)}
                    </p>

                    <p>
                      <strong>Auction starts:</strong>{" "}
                      {formatDate(auction.startDate, true)}
                    </p>
                  </div>

                  {/* Dates and Actions */}
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(auction.createdAt)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/auction/${auction.id}`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View Auction
                      </Link>

                      <Link
                        to={`/edit-auction/${auction.id}`}
                        className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(auction)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      >
                        Delete
                      </button>

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
