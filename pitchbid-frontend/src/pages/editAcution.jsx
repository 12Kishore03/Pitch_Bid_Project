
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getAuctionById,
  updateAuction,
} from "../api/auctionApi";

function EditAuction() {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    auctionName: "",
    category: "",
    description: "",
    visibility: "PUBLIC",
    numberOfTeams: "",
    teamBudget: "",
    bidIncrement: "",
  });

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load auction details from backend
  useEffect(() => {
    let active = true;

    const loadAuction = async () => {
      try {
        setLoading(true);
        setError("");

        if (!auctionId || !/^\d+$/.test(auctionId)) {
          throw new Error("Invalid auction ID.");
        }

        const data = await getAuctionById(auctionId);

        if (!active) return;

        setAuction(data);

        // Populate all editable fields
        setForm({
          auctionName: data.auctionName || "",
          category: data.category || "",
          description: data.description || "",
          visibility: data.visibility || "PUBLIC",
          numberOfTeams: data.numberOfTeams ?? "",
          teamBudget: data.teamBudget ?? "",
          bidIncrement: data.bidIncrement ?? "",
        });

      } catch (err) {
        console.error("Unable to load auction:", err);
        console.error("Backend response:", err.response?.data);

        if (active) {
          setError(
            err.response?.data?.message ||
            err.response?.data?.detail ||
            err.message ||
            "Unable to load auction details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAuction();

    return () => {
      active = false;
    };
  }, [auctionId]);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // Submit updated auction details
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (auction?.status !== "UPCOMING") {
      setError("Only upcoming auctions can be edited.");
      return;
    }

    if (!form.auctionName.trim()) {
      setError("Auction name is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Auction category is required.");
      return;
    }

    if (!form.visibility) {
      setError("Auction visibility is required.");
      return;
    }

    const numberOfTeams = Number(form.numberOfTeams);
    const teamBudget = Number(form.teamBudget);
    const bidIncrement = Number(form.bidIncrement);

    if (!Number.isInteger(numberOfTeams) || numberOfTeams < 2) {
      setError("Number of teams must be at least 2.");
      return;
    }

    if (!Number.isFinite(teamBudget) || teamBudget <= 0) {
      setError("Team budget must be greater than zero.");
      return;
    }

    if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
      setError("Bid increment must be greater than zero.");
      return;
    }

    // IMPORTANT:
    // visibility is now included in the request payload.
    const payload = {
      auctionName: form.auctionName.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      visibility: form.visibility,
      numberOfTeams,
      teamBudget,
      bidIncrement,
    };

    console.log("Updating auction with payload:", payload);

    try {
      setSaving(true);

      await updateAuction(auctionId, payload);

      alert("Auction updated successfully!");

      navigate(`/auction/${auctionId}`);

    } catch (err) {
      console.error("Unable to update auction:", err);
      console.error("Backend response:", err.response?.data);

      const fieldErrors = err.response?.data?.fieldErrors;

      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        setError(
          Object.entries(fieldErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(" | ")
        );
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to update auction. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-blue-950">
            Loading auction details...
          </p>
        </div>
      </main>
    );
  }

  // Error screen
  if (error && !auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Unable to Load Auction
          </h1>

          <p className="mt-3 text-red-600">{error}</p>

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

  // Do not allow editing non-upcoming auctions
  if (auction?.status !== "UPCOMING") {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Editing Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            Only upcoming auctions can be edited.
          </p>

          <Link
            to={`/auction/${auctionId}`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Back to Auction Details
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">

      <div className="mx-auto max-w-3xl">

        <Link
          to={`/auction/${auctionId}`}
          className="font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to Auction Details
        </Link>

        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              PitchBid · Auction Management
            </p>

            <h1 className="mt-2 text-3xl font-bold text-blue-950">
              Edit Auction
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Auction ID: {auctionId}
            </p>

            <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              UPCOMING
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Auction Name */}
            <div>
              <label
                htmlFor="auctionName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Auction Name *
              </label>

              <input
                id="auctionName"
                name="auctionName"
                type="text"
                value={form.auctionName}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Category *
              </label>

              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Visibility - FIXED */}
            <div>
              <label
                htmlFor="visibility"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Auction Visibility *
              </label>

              <select
                id="visibility"
                name="visibility"
                value={form.visibility}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
                <option value="INVITE_ONLY">Invite Only</option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Select who can discover or access this auction.
              </p>
            </div>

            {/* Number of Teams */}
            <div>
              <label
                htmlFor="numberOfTeams"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Number of Teams *
              </label>

              <input
                id="numberOfTeams"
                name="numberOfTeams"
                type="number"
                min="2"
                value={form.numberOfTeams}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Team Budget */}
            <div>
              <label
                htmlFor="teamBudget"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Budget Per Team (₹) *
              </label>

              <input
                id="teamBudget"
                name="teamBudget"
                type="number"
                min="1"
                value={form.teamBudget}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Bid Increment */}
            <div>
              <label
                htmlFor="bidIncrement"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Bid Increment (₹) *
              </label>

              <input
                id="bidIncrement"
                name="bidIncrement"
                type="number"
                min="1"
                value={form.bidIncrement}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Information */}
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              Only upcoming auctions can be edited. Registration deadlines,
              auction dates, player limits and bid timer settings remain
              unchanged in this form.
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-3">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>

              <Link
                to={`/auction/${auctionId}`}
                className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>

            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default EditAuction;
