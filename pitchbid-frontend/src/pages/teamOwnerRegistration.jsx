

import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { saveOwnerRegistration, getOwnerRegistrationsByAuction } from "../utils/OwnerRegistrationStorage";
import { getRegistrationsByAuction } from "../utils/RegistrationStorage";

const initialData = {
  // Owner personal details
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  city: "",

  // Team details
  teamName: "",
  teamShortName: "",
  teamCity: "",
  teamLogo: null,
  teamDescription: "",

  // Owner as Player #1
  playerRole: "",
  battingStyle: "",
  bowlingStyle: "",
  wicketkeeper: "No",

  // Confirmation
  termsAccepted: false,
};

function TeamOwnerRegistration() {
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

    // Make sure this is an owner registration link
    if (role !== "owner") {
      setError(
        "This link is not a valid team owner registration link."
      );
      return;
    }

    // -------------------------
    // Personal Information
    // -------------------------

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // Prevent a person registered as an individual player from registering
    // as a team owner in this same auction, and prevent duplicate owners.
    const normalizedEmail = formData.email.trim().toLowerCase();
    const existingPlayers = getRegistrationsByAuction(auctionId);
    const existingOwners = getOwnerRegistrationsByAuction(auctionId);

    const alreadyRegisteredAsPlayer = existingPlayers.some(
      (player) => String(player.email || "").trim().toLowerCase() === normalizedEmail
    );

    if (alreadyRegisteredAsPlayer) {
      setError(
        "This email is already registered as an individual player in this auction. A person cannot register as both an individual player and a team owner in the same auction."
      );
      return;
    }

    const alreadyRegisteredAsOwner = existingOwners.some(
      (registration) =>
        String(registration.owner?.email || "").trim().toLowerCase() === normalizedEmail
    );

    if (alreadyRegisteredAsOwner) {
      setError("This email is already registered as a team owner in this auction.");
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

    // -------------------------
    // Team Information
    // -------------------------

    if (!formData.teamName.trim()) {
      setError("Please enter your team name.");
      return;
    }

    if (!formData.teamShortName.trim()) {
      setError("Please enter your team short name.");
      return;
    }

    if (formData.teamShortName.trim().length > 5) {
      setError(
        "Team short name should not contain more than 5 characters."
      );
      return;
    }

    if (!formData.teamCity.trim()) {
      setError("Please enter your team city.");
      return;
    }

    // -------------------------
    // Owner as Player #1
    // -------------------------

    if (!formData.playerRole) {
      setError("Please select your player role.");
      return;
    }

    if (!formData.battingStyle) {
      setError("Please select your batting style.");
      return;
    }

    if (
      formData.playerRole !== "Batsman" &&
      !formData.bowlingStyle
    ) {
      setError("Please select your bowling style.");
      return;
    }

    // -------------------------
    // Terms
    // -------------------------

    if (!formData.termsAccepted) {
      setError(
        "Please accept the auction terms and conditions."
      );
      return;
    }

    // -------------------------
    // Registration Object
    // -------------------------

    const ownerRegistration = {
      auctionId,

      owner: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        city: formData.city,
      },

      team: {
        teamName: formData.teamName,
        teamShortName:
          formData.teamShortName.toUpperCase(),
        teamCity: formData.teamCity,
        teamLogo: formData.teamLogo,
        teamDescription: formData.teamDescription,
      },

      ownerAsPlayer: {
        playerNumber: 1,
        playerRole: formData.playerRole,
        battingStyle: formData.battingStyle,
        bowlingStyle: formData.bowlingStyle,
        wicketkeeper: formData.wicketkeeper,
        status: "Automatically Registered",
      },

      status: "Pending Approval",
      registeredAt: new Date().toISOString(),
    };

    try {
      saveOwnerRegistration(ownerRegistration);
      setSubmitted(true);
    } catch (saveError) {
      console.error("Failed to save team owner registration:", saveError);
      setError(
        saveError.message || "Unable to save your team registration. Please try again."
      );
    }
  };

  const handleReset = () => {
    setFormData({
      ...initialData,
    });

    setError("");
    setSubmitted(false);
  };

  // ---------------------------------
  // Invalid Role
  // ---------------------------------

  if (role !== "owner") {
    return (
      <div className="min-h-screen bg-blue-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-blue-950">
              Invalid Registration Link
            </h1>

            <p className="mt-3 text-gray-600">
              This link is not configured for team owner
              registration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------
  // Success Screen
  // ---------------------------------

  if (submitted) {
    return (
      <div className="min-h-screen bg-blue-50 px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
              ✓
            </div>

            <h1 className="mt-5 text-2xl font-bold text-blue-950 sm:text-3xl">
              Team Registration Submitted
            </h1>

            <p className="mt-3 text-gray-600">
              Your team has been registered successfully for
              this auction.
            </p>

            <div className="mt-6 rounded-xl bg-blue-50 p-5 text-left">

              <div className="flex justify-between border-b border-blue-100 pb-3">
                <span className="text-sm text-gray-500">
                  Team
                </span>

                <span className="font-semibold text-blue-950">
                  {formData.teamName}
                </span>
              </div>

              <div className="flex justify-between border-b border-blue-100 py-3">
                <span className="text-sm text-gray-500">
                  Team Short Name
                </span>

                <span className="font-semibold text-blue-950">
                  {formData.teamShortName.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between border-b border-blue-100 py-3">
                <span className="text-sm text-gray-500">
                  Owner
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
                  Owner Player Status
                </span>

                <span className="font-semibold text-green-600">
                  Player #1
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-sm text-gray-500">
                  Registration Status
                </span>

                <span className="font-semibold text-yellow-600">
                  Pending Approval
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-green-50 p-4 text-left text-sm text-green-800">
              <p className="font-semibold">
                Owner automatically added as Player #1
              </p>

              <p className="mt-1">
                You are automatically registered as the first
                player of your own team. You do not need to
                register separately as a player.
              </p>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              The auction creator will review your team
              registration before the auction begins.
            </p>

            <button
              type="button"
              onClick={handleReset}
              className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Register Another Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------
  // Registration Form
  // ---------------------------------

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-10 sm:px-6">

      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <p className="font-semibold uppercase tracking-wider text-blue-700">
            PitchBid
          </p>

          <h1 className="mt-2 text-3xl font-bold text-blue-950 sm:text-4xl">
            Team Owner Registration
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Register your team for this cricket auction.
            As the team owner, you will automatically become
            Player #1 of your own team.
          </p>

          <div className="mt-4 inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            Auction ID: {auctionId}
          </div>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">

          <form onSubmit={handleSubmit}>

            {/* =====================================
                PERSONAL INFORMATION
            ====================================== */}

            <section>

              <h2 className="text-xl font-bold text-blue-950">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter your personal details as the team owner.
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

                {/* Date of Birth */}
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

            {/* =====================================
                TEAM INFORMATION
            ====================================== */}

            <section className="mt-10 border-t border-gray-100 pt-8">

              <h2 className="text-xl font-bold text-blue-950">
                Team Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create the team that will participate in the
                auction.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Team Name */}
                <div className="sm:col-span-2">

                  <label
                    htmlFor="teamName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Team Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="teamName"
                    type="text"
                    value={formData.teamName}
                    onChange={(event) =>
                      updateField(
                        "teamName",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Chennai Strikers"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* Team Short Name */}
                <div>

                  <label
                    htmlFor="teamShortName"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Team Short Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="teamShortName"
                    type="text"
                    maxLength="5"
                    value={formData.teamShortName}
                    onChange={(event) =>
                      updateField(
                        "teamShortName",
                        event.target.value
                      )
                    }
                    placeholder="e.g. CST"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 uppercase outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Maximum 5 characters.
                  </p>

                </div>

                {/* Team City */}
                <div>

                  <label
                    htmlFor="teamCity"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Team City
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="teamCity"
                    type="text"
                    value={formData.teamCity}
                    onChange={(event) =>
                      updateField(
                        "teamCity",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Chennai"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* Team Logo */}
                <div className="sm:col-span-2">

                  <label
                    htmlFor="teamLogo"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Team Logo
                  </label>

                  <input
                    id="teamLogo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      updateField(
                        "teamLogo",
                        event.target.files?.[0] || null
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG or WebP recommended.
                  </p>

                </div>

                {/* Description */}
                <div className="sm:col-span-2">

                  <label
                    htmlFor="teamDescription"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Team Description
                  </label>

                  <textarea
                    id="teamDescription"
                    rows="4"
                    value={formData.teamDescription}
                    onChange={(event) =>
                      updateField(
                        "teamDescription",
                        event.target.value
                      )
                    }
                    placeholder="Tell us briefly about your team..."
                    className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

            </section>

            {/* =====================================
                OWNER AS PLAYER #1
            ====================================== */}

            <section className="mt-10 border-t border-gray-100 pt-8">

              <h2 className="text-xl font-bold text-blue-950">
                Owner as Player #1
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                As the team owner, you will automatically be
                registered as the first player of your own team.
              </p>

              <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                You do not need to register separately as a
                player.
              </div>

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

            {/* =====================================
                TERMS
            ====================================== */}

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

                  <span className="ml-1 text-red-500">
                    *
                  </span>

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
              Register Team & Join Auction
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default TeamOwnerRegistration;