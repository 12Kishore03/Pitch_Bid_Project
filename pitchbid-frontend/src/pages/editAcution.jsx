
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAuctionById,
  updateAuction,
} from "../utils/AuctionStroage";

function EditAuction() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const auction = getAuctionById(auctionId);

  const [form, setForm] = useState(() => ({
    auctionName: auction?.auctionName || "",
    category: auction?.category || "",
    description: auction?.description || "",
    numberOfTeams: auction?.numberOfTeams ?? "",
    teamBudget: auction?.teamBudget ?? "",
    bidIncrement: auction?.bidIncrement ?? "",
  }));

  const [error, setError] = useState("");

  if (!auction) {
    return (
      <main className="min-h-screen bg-blue-50 p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-blue-950">
            Auction Not Found
          </h1>
          <Link to="/dashboard" className="mt-5 inline-block text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!form.auctionName.trim()) {
      setError("Auction name is required.");
      return;
    }

    if (
      Number(form.numberOfTeams) < 2 ||
      Number(form.teamBudget) <= 0 ||
      Number(form.bidIncrement) <= 0
    ) {
      setError(
        "Enter at least 2 teams, a positive team budget, and a positive bid increment."
      );
      return;
    }

    try {
      updateAuction(auctionId, {
        ...form,
        numberOfTeams: Number(form.numberOfTeams),
        teamBudget: Number(form.teamBudget),
        bidIncrement: Number(form.bidIncrement),
      });

      navigate(`/auction/${auctionId}`);
    } catch (err) {
      console.error("Unable to update auction:", err);
      setError("Unable to save changes. Please try again.");
    }
  };

  const fields = [
    { name: "auctionName", label: "Auction Name", type: "text" },
    { name: "category", label: "Category", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "numberOfTeams", label: "Number of Teams", type: "number" },
    { name: "teamBudget", label: "Budget Per Team (₹)", type: "number" },
    { name: "bidIncrement", label: "Bid Increment (₹)", type: "number" },
  ];

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="font-semibold text-blue-700">
          ← Back to Dashboard
        </Link>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-blue-950">
            Edit Auction
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Auction ID: {auction.id}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {field.label}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    min={field.type === "number" ? 1 : undefined}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-3 pt-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Save Changes
              </button>

              <Link
                to={`/auction/${auction.id}`}
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
