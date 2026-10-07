import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const initialData = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  city: "",
  playerRole: "",
  battingStyle: "",
  bowlingStyle: "",
  wicketkeeper: "No",
  basePrice: "",
  profilePhoto: null,
  termsAccepted: false,
};

function PlayerRegistration() {
  const { auctionId } = useParams();
  const [searchParams] = useSearchParams();

  const role = searchParams.get("role");

  const [formData, setFormData] = useState({
    ...initialData,
  });

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    // Make sure this page is being accessed
    // through the player registration link.
    if (role !== "player") {
      setError(
        "This link is not a valid player registration link."
      );
      return;
    }

    // Required field validation
    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!formData.dateOfBirth) {
      setError("Please select your date of birth.");
      return;
    }

    if (!formData.gender) {
      setError("Please select your gender.");
      return;
    }

    if (!formData.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!formData.playerRole) {
      setError("Please select your player role.");
      return;
    }

    if (!formData.battingStyle) {
      setError("Please select your batting style.");
      return;
    }

    if (formData.playerRole !== "Batsman" && !formData.bowlingStyle) {
      setError("Please select your bowling style.");
      return;
    }

    if (!formData.basePrice) {
      setError("Please enter your base price.");
      return;
    }

    if (Number(formData.basePrice) <= 0) {
      setError("Base price must be greater than zero.");
      return;
    }

    if (!formData.termsAccepted) {
      setError(
        "Please accept the auction terms and conditions."
      );
      return;
    }

    // Frontend-only registration object.
    // This will later be sent to Spring Boot.
    const playerRegistration = {
      auctionId,
      ...formData,
      status: "Pending Approval",
      registeredAt: new Date().toISOString(),
    };

    console.log(
      "Player Registration:",
      playerRegistration
    );

    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      ...initialData,
    });

    setError("");
    setSubmitted(false);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-bold text-blue-950 sm:text-3xl">
              Registration Submitted
            </h1>

            <p className="mt-3 text-gray-600">
              Your player registration has been submitted
              successfully.
            </p>

            <div className="mt-6 rounded-xl bg-blue-50 p-5 text-left">
              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-sm text-gray-500">
                  Player
                </span>

                <span className="font-semibold text-blue-950">
                  {formData.fullName}
                </span>
              </div>

              <div className="flex justify-between border-b border-blue-100 py-3">
                <span className="text-sm text-gray-500">
                  Auction ID
                </span>

                <span className="font-semibold text-blue-950">
                  {auctionId}
                </span>
              </div>

              <div className="flex justify-between border-b border-blue-100 py-3">
                <span className="text-sm text-gray-500">
                  Base Price
                </span>

                <span className="font-semibold text-blue-950">
                  ₹
                  {Number(
                    formData.basePrice
                  ).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-sm text-gray-500">
                  Status
                </span>

                <span className="font-semibold text-yellow-600">
                  Pending Approval
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              The auction creator will review your
              registration before you can participate in
              the auction.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Register Another Player
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">

      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <p className="font-semibold uppercase tracking-wider text-blue-700">
            PitchBid
          </p>

          <h1 className="mt-2 text-3xl font-bold text-blue-950 sm:text-4xl">
            Player Registration
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Register yourself as a player for this cricket
            auction. You will enter your own base price and
            participate in the auction player pool.
          </p>

          <div className="mt-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            Auction ID: {auctionId}
          </div>

        </div>

        {/* Registration Card */}
        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">

          <form onSubmit={handleSubmit}>

            {/* Personal Information */}
            <section>

              <h2 className="text-xl font-bold text-blue-950">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter your basic personal details.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Full Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(event) =>
                      updateField(
                        "fullName",
                        event.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email Address
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Phone Number
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="Enter phone number"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Date of Birth
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(event) =>
                      updateField(
                        "dateOfBirth",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Gender
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(event) =>
                      updateField(
                        "gender",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select Gender
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>

                {/* City */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="city"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    City
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(event) =>
                      updateField(
                        "city",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Coimbatore"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>
            </section>

            {/* Cricket Information */}
            <section className="mt-10 border-t border-gray-100 pt-8">

              <h2 className="text-xl font-bold text-blue-950">
                Cricket Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tell the auction creator how you participate
                as a cricket player.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Player Role */}
                <div>
                  <label
                    htmlFor="playerRole"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Player Role
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="playerRole"
                    value={formData.playerRole}
                    onChange={(event) =>
                      updateField(
                        "playerRole",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select Player Role
                    </option>

                    <option value="Batsman">
                      Batsman
                    </option>

                    <option value="Bowler">
                      Bowler
                    </option>

                    <option value="All-rounder">
                      All-rounder
                    </option>

                    <option value="Wicketkeeper">
                      Wicketkeeper
                    </option>
                  </select>
                </div>

                {/* Batting Style */}
                <div>
                  <label
                    htmlFor="battingStyle"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Batting Style
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    id="battingStyle"
                    value={formData.battingStyle}
                    onChange={(event) =>
                      updateField(
                        "battingStyle",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select Batting Style
                    </option>

                    <option value="Right Handed">
                      Right Handed
                    </option>

                    <option value="Left Handed">
                      Left Handed
                    </option>
                  </select>
                </div>

                {/* Bowling Style */}
                <div>
                  <label
                    htmlFor="bowlingStyle"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Bowling Style
                    {formData.playerRole !== "Batsman" && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}
                  </label>

                  <select
                    id="bowlingStyle"
                    value={formData.bowlingStyle}
                    onChange={(event) =>
                      updateField(
                        "bowlingStyle",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select Bowling Style
                    </option>

                    <option value="Right Arm Fast">
                      Right Arm Fast
                    </option>

                    <option value="Left Arm Fast">
                      Left Arm Fast
                    </option>

                    <option value="Right Arm Medium">
                      Right Arm Medium
                    </option>

                    <option value="Left Arm Medium">
                      Left Arm Medium
                    </option>

                    <option value="Right Arm Spin">
                      Right Arm Spin
                    </option>

                    <option value="Left Arm Spin">
                      Left Arm Spin
                    </option>

                    <option value="Not a Bowler">
                      Not a Bowler
                    </option>
                  </select>
                </div>

                {/* Wicketkeeper */}
                <div>
                  <label
                    htmlFor="wicketkeeper"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Wicketkeeper
                  </label>

                  <select
                    id="wicketkeeper"
                    value={formData.wicketkeeper}
                    onChange={(event) =>
                      updateField(
                        "wicketkeeper",
                        event.target.value
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="No">
                      No
                    </option>

                    <option value="Yes">
                      Yes
                    </option>
                  </select>
                </div>

              </div>
            </section>

            {/* Auction Information */}
            <section className="mt-10 border-t border-gray-100 pt-8">

              <h2 className="text-xl font-bold text-blue-950">
                Auction Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Set the minimum amount at which you want to
                enter the auction.
              </p>

              <div className="mt-6">

                <label
                  htmlFor="basePrice"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Your Base Price (₹)
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  id="basePrice"
                  type="number"
                  min="1"
                  value={formData.basePrice}
                  onChange={(event) =>
                    updateField(
                      "basePrice",
                      event.target.value
                    )
                  }
                  placeholder="e.g. 50000"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  You decide the starting price for yourself.
                  The auction creator does not set this value.
                </p>

              </div>
            </section>

            {/* Profile Photo */}
            <section className="mt-10 border-t border-gray-100 pt-8">

              <h2 className="text-xl font-bold text-blue-950">
                Profile Photo
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add a photo that will be displayed during the
                auction.
              </p>

              <div className="mt-6">

                <label
                  htmlFor="profilePhoto"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Player Photo
                </label>

                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    updateField(
                      "profilePhoto",
                      event.target.files?.[0] || null
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Recommended: clear JPG, PNG or WebP image.
                </p>

              </div>
            </section>

            {/* Terms */}
            <section className="mt-10 border-t border-gray-100 pt-8">

              <label className="flex items-start gap-3">

                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(event) =>
                    updateField(
                      "termsAccepted",
                      event.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4 accent-blue-700"
                />

                <span className="text-sm text-gray-600">
                  I confirm that the information provided is
                  correct and I agree to participate in this
                  auction according to the auction rules.
                  <span className="ml-1 text-red-500">*</span>
                </span>

              </label>

            </section>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="mt-8 w-full rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Submit Player Registration
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default PlayerRegistration;