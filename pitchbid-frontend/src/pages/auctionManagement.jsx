
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAuctionById } from "../utils/AuctionStroage";
import { getRegistrationsByAuction } from "../utils/RegistrationStorage";
import { getOwnerRegistrationsByAuction } from "../utils/OwnerRegistrationStorage";

function AuctionManagement() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const [copyMessage, setCopyMessage] = useState("");

  const auction = getAuctionById(auctionId);

  const copyRegistrationLink = async (link, label) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage(`${label} registration link copied!`);
    } catch {
      setCopyMessage("Copy was blocked by your browser. Select the link text and copy it manually.");
    }
  };

  // Player registrations for this auction
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

  // Team owner registrations for this auction
  const ownerRegistrations =
    getOwnerRegistrationsByAuction(auctionId);

  const pendingOwners = ownerRegistrations.filter(
    (owner) => owner.status === "Pending Approval"
  ).length;

  const approvedOwners = ownerRegistrations.filter(
    (owner) => owner.status === "Approved"
  ).length;

  const rejectedOwners = ownerRegistrations.filter(
    (owner) => owner.status === "Rejected"
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

  // Readiness checks are calculated from the saved auction configuration
  // and the registration records currently stored in this browser.
  const requiredTeams = Number(auction.numberOfTeams);
  const teamBudget = Number(auction.teamBudget);
  const bidIncrement = Number(auction.bidIncrement);
  const bidTimer = Number(auction.bidTimer);
  const approvedTeamCount = ownerRegistrations.filter(
    (owner) => owner.status === "Approved"
  ).length;

  const readinessChecks = [
    {
      label: "Auction details",
      ready: Boolean(auction.auctionName?.trim() && auction.category),
      detail: "Auction name and category must be provided.",
      action: { label: "Edit auction", to: `/edit-auction/${auction.id}` },
    },
    {
      label: "Team configuration and budget",
      ready: Number.isFinite(requiredTeams) && requiredTeams > 0 && Number.isFinite(teamBudget) && teamBudget > 0,
      detail: "Set a valid number of teams and a budget greater than zero for each team.",
      action: { label: "Edit auction", to: `/edit-auction/${auction.id}` },
    },
    {
      label: "Approved team owners",
      ready: Number.isFinite(requiredTeams) && requiredTeams > 0 && approvedTeamCount >= requiredTeams,
      detail: `${approvedTeamCount} approved team owner(s) out of ${Number.isFinite(requiredTeams) && requiredTeams > 0 ? requiredTeams : "an unspecified"} required team(s).`,
      action: { label: "Manage team owners", to: `/auction-management/${auction.id}/owners` },
    },
    {
      label: "Approved players",
      ready: approvedPlayers > 0,
      detail: `${approvedPlayers} approved player(s) available for the auction. At least one approved player is required.`,
      action: { label: "Manage players", to: `/auction-management/${auction.id}/players` },
    },
    {
      label: "Bidding rules",
      ready: Number.isFinite(bidIncrement) && bidIncrement > 0 && Number.isFinite(bidTimer) && bidTimer > 0,
      detail: "Configure a bid increment and bid timer, both greater than zero.",
      action: { label: "Edit auction", to: `/edit-auction/${auction.id}` },
    },
    {
      label: "Registration options",
      ready: Boolean(auction.teamRegistration || auction.playerRegistration),
      detail: "Enable at least one registration type for this auction.",
      action: { label: "Edit auction", to: `/edit-auction/${auction.id}` },
    },
    {
      label: "Auction status",
      ready: !auction.status || auction.status === "Upcoming",
      detail: `Current status: ${auction.status || "Upcoming"}. Readiness is intended to be checked before the auction starts.`,
      action: null,
    },
  ];
  const readyCheckCount = readinessChecks.filter((check) => check.ready).length;
  const isAuctionReady = readinessChecks.every((check) => check.ready);

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

        {/* Auction configuration and player registrations */}
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
              Review registered players and manage their approval
              status before the live auction begins.
            </p>

            {/* Player statistics */}
            <div className="mt-5 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-sm text-gray-600">
                  Total Players
                </p>
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
                <p className="text-sm text-gray-600">
                  Approved
                </p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {approvedPlayers}
                </p>
              </div>

              <div className="rounded-xl bg-gray-100 p-4">
                <p className="text-sm text-gray-600">
                  Rejected
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-700">
                  {rejectedPlayers}
                </p>
              </div>

            </div>

            <Link
              to={`/auction-management/${auction.id}/players`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Player Registrations
            </Link>

            {auction.playerRegistration && auction.registrationLinks?.player && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">Share Player Registration</p>
                <input readOnly value={auction.registrationLinks.player} onFocus={(event) => event.target.select()} aria-label="Player registration link" className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700" />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => copyRegistrationLink(auction.registrationLinks.player, "Player")} className="flex-1 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Copy Player Link</button>
                  <a href={auction.registrationLinks.player} target="_blank" rel="noreferrer" className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-center text-sm font-semibold text-blue-700 hover:bg-blue-100">Preview Link</a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Team owner registrations */}
        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 sm:p-8">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Team Management
            </p>

            <h2 className="mt-2 text-2xl font-bold text-blue-950">
              Team Owner Registrations
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review team details, verify the owner, and manage
              team registration approvals for this auction.
              Each owner is automatically registered as Player #1
              for their team.
            </p>
          </div>

          {/* Owner registration statistics */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-gray-600">
                Total Teams
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-900">
                {ownerRegistrations.length}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-gray-600">
                Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {pendingOwners}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-600">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {approvedOwners}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-sm text-gray-600">
                Rejected
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-700">
                {rejectedOwners}
              </p>
            </div>

          </div>

          {/* Open team owner management */}
          <Link
            to={`/auction-management/${auction.id}/owners`}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Manage Team Owner Registrations
          </Link>

          {/* Easy-to-copy team owner registration link */}
          {auction.teamRegistration && auction.registrationLinks?.owner && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-blue-950">Share Team Owner Registration</p>
              <input readOnly value={auction.registrationLinks.owner} onFocus={(event) => event.target.select()} aria-label="Team owner registration link" className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-gray-700" />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => copyRegistrationLink(auction.registrationLinks.owner, "Team owner")} className="flex-1 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800">Copy Team Owner Link</button>
                <a href={auction.registrationLinks.owner} target="_blank" rel="noreferrer" className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100">Preview Link</a>
              </div>
            </div>
          )}

          {copyMessage && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{copyMessage}</p>}

        </section>

        {/* Auction readiness checklist */}
        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Pre-auction checklist
              </p>
              <h2 className="mt-2 text-2xl font-bold text-blue-950">
                Auction Readiness
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Review these requirements before starting the live auction. The checklist uses this auction's saved settings and registration approval statuses.
              </p>
            </div>
            <span className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-bold ${isAuctionReady ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {isAuctionReady ? "Ready to Start" : "Not Ready Yet"}
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Auction readiness progress" aria-valuemin={0} aria-valuemax={readinessChecks.length} aria-valuenow={readyCheckCount}>
            <div
              className={`h-full rounded-full transition-all ${isAuctionReady ? "bg-green-600" : "bg-blue-600"}`}
              style={{ width: `${(readyCheckCount / readinessChecks.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {readyCheckCount} of {readinessChecks.length} checks completed
          </p>

          <div className="mt-5 space-y-3">
            {readinessChecks.map((check) => (
              <div key={check.label} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${check.ready ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${check.ready ? "bg-green-600 text-white" : "bg-amber-500 text-white"}`} aria-hidden="true">
                    {check.ready ? "✓" : "!"}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{check.label}</h3>
                    <p className="mt-1 text-sm leading-5 text-gray-600">{check.detail}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 pl-9 sm:pl-0">
                  <span className={`text-sm font-semibold ${check.ready ? "text-green-700" : "text-amber-700"}`}>
                    {check.ready ? "Complete" : "Action Required"}
                  </span>
                  {!check.ready && check.action && (
                    <Link to={check.action.to} className="text-sm font-semibold text-blue-700 hover:underline">
                      {check.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            This checklist is an informational frontend check. It does not start or lock the auction; the live-auction controls will be implemented separately. Registration and approval data currently come from this browser's local storage.
          </p>
        </section>

        {/* Live auction entry */}
        <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Auction Control Room
              </p>
              <h2 className="mt-2 text-2xl font-bold text-blue-950">
                Live Auction
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Open the live auction screen when all readiness checks are complete.
                The countdown will not begin until you press Start Bidding on the live screen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/live-auction/${auction.id}`)}
              disabled={!isAuctionReady}
              className={`inline-flex shrink-0 items-center justify-center rounded-lg px-6 py-3 font-semibold transition ${
                isAuctionReady
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
              title={
                isAuctionReady
                  ? "Open the live auction control room"
                  : "Complete every readiness check before opening the live auction"
              }
            >
              {isAuctionReady ? "Open Live Auction →" : "Complete Checklist First"}
            </button>
          </div>

          {!isAuctionReady && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              The live auction is locked until all {readinessChecks.length} readiness checks pass.
              Review the checklist above and complete each outstanding requirement.
            </p>
          )}

          {isAuctionReady && (
            <p className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3 text-sm leading-6 text-green-800">
              All readiness checks passed. You can open the live auction screen.
              Bidding still requires you to press Start Bidding there.
            </p>
          )}
        </section>

      </div>
    </main>
  );
}

export default AuctionManagement;
