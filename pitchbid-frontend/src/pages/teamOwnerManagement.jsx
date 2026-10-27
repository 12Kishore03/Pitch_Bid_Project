
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAuctionById } from "../utils/AuctionStroage";
import {
  getOwnerRegistrationsByAuction,
  updateOwnerRegistrationStatus,
} from "../utils/OwnerRegistrationStorage";

const STATUS_STYLES = {
  "Pending Approval": "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

// Supports saved data from the current and earlier field names.
function getTeamValue(team, field) {
  const aliases = {
    teamName: ["teamName", "name"],
    shortName: ["teamShortName", "teamshortName", "shortName"],
    city: ["teamCity", "teamcity", "city"],
    description: [
      "teamDescription",
      "teamdescription",
      "description",
    ],
  };

  for (const key of aliases[field] || [field]) {
    const value = team?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function getOwnerValue(owner, field) {
  const aliases = {
    fullName: ["fullName", "name", "ownerName"],
    email: ["email", "ownerEmail"],
    phone: ["phone", "phoneNumber", "ownerPhone"],
    city: ["city", "ownerCity"],
  };

  for (const key of aliases[field] || [field]) {
    const value = owner?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function getPlayerValue(player, field) {
  const aliases = {
    playerRole: ["playerRole", "role"],
    battingStyle: ["battingStyle"],
    bowlingStyle: ["bowlingStyle"],
    wicketkeeper: ["wicketkeeper", "isWicketkeeper", "isWicketKeeper"],
  };

  for (const key of aliases[field] || [field]) {
    const value = player?.[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function displayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "Not provided";
  }

  return value;
}

function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words font-medium text-gray-800">
        {displayValue(value)}
      </p>
    </div>
  );
}

function WicketkeeperValue({ value }) {
  if (value === true || value === "Yes" || value === "yes") {
    return "Yes";
  }

  if (value === false || value === "No" || value === "no") {
    return "No";
  }

  return displayValue(value);
}

export default function TeamOwnerManagement() {
  const { auctionId } = useParams();

  const [auction] = useState(() => getAuctionById(auctionId));

  const [registrations, setRegistrations] = useState(() =>
    getOwnerRegistrationsByAuction(auctionId)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [updatingId, setUpdatingId] = useState(null);

  const counts = useMemo(
    () => ({
      total: registrations.length,
      pending: registrations.filter(
        (item) => item.status === "Pending Approval"
      ).length,
      approved: registrations.filter(
        (item) => item.status === "Approved"
      ).length,
      rejected: registrations.filter(
        (item) => item.status === "Rejected"
      ).length,
    }),
    [registrations]
  );

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return registrations.filter((registration) => {
      const owner = registration.owner || {};
      const team = registration.team || {};
      const player = registration.ownerAsPlayer || {};

      const searchableValues = [
        getTeamValue(team, "teamName"),
        getTeamValue(team, "shortName"),
        getTeamValue(team, "city"),
        getTeamValue(team, "description"),
        getOwnerValue(owner, "fullName"),
        getOwnerValue(owner, "email"),
        getOwnerValue(owner, "phone"),
        getOwnerValue(owner, "city"),
        getPlayerValue(player, "playerRole"),
        registration.status,
      ];

      const searchableText = searchableValues
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        registration.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  function refreshRegistrations() {
    try {
      setRegistrations(getOwnerRegistrationsByAuction(auctionId));
      setMessage("Registration list refreshed.");
      setMessageType("success");
    } catch {
      setMessage("Unable to refresh registrations. Please try again.");
      setMessageType("error");
    }
  }

  function handleStatusChange(registration, newStatus) {
    if (registration.status !== "Pending Approval") {
      setMessage(
        "Only pending registrations can be approved or rejected."
      );
      setMessageType("error");
      return;
    }

    if (!registration.id) {
      setMessage("Registration ID is missing.");
      setMessageType("error");
      return;
    }

    const action = newStatus === "Approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this team registration?`
    );

    if (!confirmed) return;

    setUpdatingId(registration.id);
    setMessage("");

    try {
      updateOwnerRegistrationStatus(registration.id, newStatus);

      const updatedRegistrations =
        getOwnerRegistrationsByAuction(auctionId);

      const updatedRegistration = updatedRegistrations.find(
        (item) => item.id === registration.id
      );

      if (
        !updatedRegistration ||
        updatedRegistration.status !== newStatus
      ) {
        throw new Error(
          "The registration status could not be verified."
        );
      }

      setRegistrations(updatedRegistrations);

      setMessage(
        `${getTeamValue(registration.team, "teamName") || "Team"} has been ${newStatus.toLowerCase()}.`
      );

      setMessageType("success");
    } catch (error) {
      setMessage(
        error.message || "Unable to update the registration."
      );
      setMessageType("error");

      try {
        setRegistrations(
          getOwnerRegistrationsByAuction(auctionId)
        );
      } catch {
        // Keep the existing registrations if refreshing also fails.
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-blue-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Auction Not Found
          </h1>

          <p className="mt-3 text-gray-600">
            We could not find the auction associated with this link.
          </p>

          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/auction-management/${auctionId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <span aria-hidden="true">←</span>
            Back to Auction Management
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                PitchBid · Creator Panel
              </p>

              <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                Team Owner Management
              </h1>

              <p className="mt-2 text-gray-600">
                Review team registrations and manage their approval status.
              </p>

              <p className="mt-3 font-medium text-gray-800">
                Auction:{" "}
                {auction.auctionName ||
                  auction.name ||
                  "Untitled Auction"}
              </p>

              <p className="text-sm text-gray-500">
                Auction ID: {auction.id || auctionId}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshRegistrations}
              className="rounded-lg border border-blue-200 bg-white px-4 py-3 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
            >
              ↻ Refresh Registrations
            </button>
          </div>
        </div>

        {/* Success and error messages */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Registration counts */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Teams",
              value: counts.total,
              color: "text-blue-700",
              icon: "👥",
            },
            {
              label: "Pending Approval",
              value: counts.pending,
              color: "text-amber-700",
              icon: "⏳",
            },
            {
              label: "Approved Teams",
              value: counts.approved,
              color: "text-green-700",
              icon: "✓",
            },
            {
              label: "Rejected Teams",
              value: counts.rejected,
              color: "text-red-700",
              icon: "✕",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">
                  {card.label}
                </p>

                <span className="text-xl" aria-hidden="true">
                  {card.icon}
                </span>
              </div>

              <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search and status filter */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <div>
              <label
                htmlFor="owner-search"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Search teams and owners
              </label>

              <input
                id="owner-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search team name, short name, owner email..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="owner-status"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Registration status
              </label>

              <select
                id="owner-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All statuses</option>
                <option value="Pending Approval">
                  Pending Approval
                </option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Showing {filteredRegistrations.length} of{" "}
            {registrations.length} team registrations.
          </p>
        </div>

        {/* Team registrations */}
        {filteredRegistrations.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-4xl" aria-hidden="true">
              🏏
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              {registrations.length === 0
                ? "No Team Registrations Yet"
                : "No Matching Registrations"}
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-gray-600">
              {registrations.length === 0
                ? "Team owner registrations will appear here after owners submit the registration form."
                : "Try a different search term or change the status filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRegistrations.map((registration) => {
              const owner = registration.owner || {};
              const team = registration.team || {};
              const player = registration.ownerAsPlayer || {};

              const teamName = getTeamValue(team, "teamName");
              const shortName = getTeamValue(team, "shortName");
              const teamCity = getTeamValue(team, "city");
              const teamDescription = getTeamValue(
                team,
                "description"
              );

              const ownerName = getOwnerValue(owner, "fullName");
              const ownerEmail = getOwnerValue(owner, "email");
              const ownerPhone = getOwnerValue(owner, "phone");
              const ownerCity = getOwnerValue(owner, "city");

              const playerRole = getPlayerValue(player, "playerRole");
              const battingStyle = getPlayerValue(
                player,
                "battingStyle"
              );
              const bowlingStyle = getPlayerValue(
                player,
                "bowlingStyle"
              );
              const wicketkeeper = getPlayerValue(
                player,
                "wicketkeeper"
              );

              const status =
                registration.status || "Pending Approval";

              const isUpdating =
                updatingId === registration.id;

              return (
                <article
                  key={registration.id}
                  className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
                >
                  {/* Team card header */}
                  <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            {teamName || "Unnamed Team"}
                          </h2>

                          {shortName && (
                            <span className="rounded-md bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                              {shortName}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          {teamCity || "City not provided"}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          Registered:{" "}
                          {formatDate(registration.registeredAt)}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
                          STATUS_STYLES[status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-7 p-5 sm:p-6">
                    {/* Team information */}
                    <section>
                      <h3 className="mb-4 text-lg font-bold text-gray-900">
                        Team Information
                      </h3>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail
                          label="Team Name"
                          value={teamName}
                        />
                        <Detail
                          label="Short Name"
                          value={shortName}
                        />
                        <Detail
                          label="Team City"
                          value={teamCity}
                        />
                        <Detail
                          label="Team Description"
                          value={teamDescription}
                        />
                      </div>
                    </section>

                    <div className="border-t border-gray-100" />

                    {/* Owner details */}
                    <section>
                      <h3 className="mb-4 text-lg font-bold text-gray-900">
                        Team Owner Details
                      </h3>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail
                          label="Owner Name"
                          value={ownerName}
                        />
                        <Detail
                          label="Email"
                          value={ownerEmail}
                        />
                        <Detail
                          label="Phone"
                          value={ownerPhone}
                        />
                        <Detail
                          label="Owner City"
                          value={ownerCity}
                        />
                      </div>
                    </section>

                    <div className="border-t border-gray-100" />

                    {/* Owner as Player #1 */}
                    <section>
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          Owner as Player #1
                        </h3>

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          Player #1
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail
                          label="Playing Role"
                          value={playerRole}
                        />
                        <Detail
                          label="Batting Style"
                          value={battingStyle}
                        />
                        <Detail
                          label="Bowling Style"
                          value={bowlingStyle}
                        />
                        <Detail
                          label="Wicketkeeper"
                          value={
                            wicketkeeper === "" ||
                            wicketkeeper === null
                              ? ""
                              : <WicketkeeperValue value={wicketkeeper} />
                          }
                        />
                      </div>
                    </section>

                    {/* Approve / reject actions */}
                    {status === "Pending Approval" ? (
                      <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleStatusChange(
                              registration,
                              "Rejected"
                            )
                          }
                          className="rounded-lg border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Reject Team"}
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleStatusChange(
                              registration,
                              "Approved"
                            )
                          }
                          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating
                            ? "Updating..."
                            : "Approve Team"}
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 pt-5 text-sm text-gray-500">
                        This registration has already been{" "}
                        {status.toLowerCase()}.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
