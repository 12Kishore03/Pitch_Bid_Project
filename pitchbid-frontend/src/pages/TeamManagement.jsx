
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAuctionById } from "../api/auctionApi";
import {
  getAuctionTeams,
  getTeamById,
  getTeamPlayers,
  updateTeam,
} from "../api/teamApi";

const EMPTY_FORM = {
  teamName: "",
  teamShortName: "",
  teamCity: "",
  teamDescription: "",
  teamLogoPath: "",
};

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(" | ");
  }

  return data?.message || data?.detail || error?.message || fallback;
}

function TeamManagement() {
  const { auctionId } = useParams();

  const [auction, setAuction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [players, setPlayers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const canEdit = auction?.status === "UPCOMING";

  // Load auction and teams
  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        if (!auctionId || !/^\d+$/.test(auctionId)) {
          throw new Error("Invalid auction ID.");
        }

        const [auctionData, teamsData] = await Promise.all([
          getAuctionById(auctionId),
          getAuctionTeams(auctionId),
        ]);

        if (!active) return;

        setAuction(auctionData);

        // Support a plain array or common paginated response shapes.
        const teamList = Array.isArray(teamsData)
          ? teamsData
          : teamsData?.content ||
            teamsData?.teams ||
            teamsData?.data ||
            [];

        setTeams(Array.isArray(teamList) ? teamList : []);
      } catch (err) {
        console.error("Team Management loading failed:", err);
        console.error("Backend response:", err.response?.data);

        if (active) {
          setError(
            getErrorMessage(err, "Unable to load Team Management.")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPage();

    return () => {
      active = false;
    };
  }, [auctionId]);

  // Search and filter teams
  const filteredTeams = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        String(team.status || "").toUpperCase() === statusFilter;

      const searchableText = [
        team.teamName,
        team.teamShortName,
        team.teamCity,
        team.ownerName,
        team.ownerEmail,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus &&
        (!searchText || searchableText.includes(searchText));
    });
  }, [teams, search, statusFilter]);

  const approvedCount = teams.filter(
    (team) => String(team.status).toUpperCase() === "APPROVED"
  ).length;

  const pendingCount = teams.filter(
    (team) => String(team.status).toUpperCase() === "PENDING"
  ).length;

  // Open a team's details and players
  const handleViewTeam = async (team) => {
    try {
      setSelectedTeam(null);
      setPlayers([]);
      setEditing(false);
      setDetailError("");
      setSuccess("");
      setDetailsLoading(true);

      const [teamData, playerData] = await Promise.all([
        getTeamById(auctionId, team.id),
        getTeamPlayers(auctionId, team.id),
      ]);

      setSelectedTeam(teamData);

      const playerList = Array.isArray(playerData)
        ? playerData
        : playerData?.content ||
          playerData?.players ||
          playerData?.data ||
          [];

      setPlayers(Array.isArray(playerList) ? playerList : []);

      setForm({
        teamName: teamData.teamName || "",
        teamShortName: teamData.teamShortName || "",
        teamCity: teamData.teamCity || "",
        teamDescription: teamData.teamDescription || "",
        teamLogoPath: teamData.teamLogoPath || "",
      });
    } catch (err) {
      console.error("Unable to load team:", err);
      console.error("Backend response:", err.response?.data);

      setDetailError(
        getErrorMessage(err, "Unable to load team details.")
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setDetailError("");
    setSuccess("");
  };

  // Save team details
  const handleUpdateTeam = async (event) => {
    event.preventDefault();

    if (!selectedTeam) return;

    if (!canEdit) {
      setDetailError("Team details can only be edited before the auction starts.");
      return;
    }

    if (!form.teamName.trim()) {
      setDetailError("Team name is required.");
      return;
    }

    if (!form.teamShortName.trim()) {
      setDetailError("Team short name is required.");
      return;
    }

    const payload = {
      teamName: form.teamName.trim(),
      teamShortName: form.teamShortName.trim(),
      teamCity: form.teamCity.trim(),
      teamDescription: form.teamDescription.trim(),
      teamLogoPath: form.teamLogoPath.trim(),
    };

    try {
      setSaving(true);
      setDetailError("");
      setSuccess("");

      const updatedTeam = await updateTeam(
        auctionId,
        selectedTeam.id,
        payload
      );

      // Refresh the selected team's details
      const refreshedTeam =
        updatedTeam && updatedTeam.id
          ? updatedTeam
          : await getTeamById(auctionId, selectedTeam.id);

      setSelectedTeam(refreshedTeam);

      setTeams((previous) =>
        previous.map((team) =>
          String(team.id) === String(refreshedTeam.id)
            ? { ...team, ...refreshedTeam }
            : team
        )
      );

      setForm({
        teamName: refreshedTeam.teamName || "",
        teamShortName: refreshedTeam.teamShortName || "",
        teamCity: refreshedTeam.teamCity || "",
        teamDescription: refreshedTeam.teamDescription || "",
        teamLogoPath: refreshedTeam.teamLogoPath || "",
      });

      setEditing(false);
      setSuccess("Team details updated successfully.");
    } catch (err) {
      console.error("Team update failed:", err);
      console.error("Backend response:", err.response?.data);

      setDetailError(
        getErrorMessage(err, "Unable to update team details.")
      );
    } finally {
      setSaving(false);
    }
  };

  const closeDetails = () => {
    setSelectedTeam(null);
    setPlayers([]);
    setEditing(false);
    setDetailError("");
    setSuccess("");
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "Not available";

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString("en-IN");
  };

  const statusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-blue-50 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 font-semibold text-blue-950">
            Loading teams...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-blue-50 p-6">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-blue-950">
            Unable to Load Teams
          </h1>
          <p className="mt-3 text-red-600">{error}</p>
          <Link
            to={`/auction-management/${auctionId}`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Back to Auction Management
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">

        <Link
          to={`/auction-management/${auctionId}`}
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to Auction Management
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              PitchBid · Team Management
            </p>
            <h1 className="mt-2 text-3xl font-bold text-blue-950">
              Manage Teams
            </h1>
            <p className="mt-2 text-gray-600">
              {auction?.auctionName || "Auction"} · Auction ID: {auctionId}
            </p>
          </div>

          <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusClass(auction?.status)}`}>
            Auction: {auction?.status || "Unknown"}
          </span>
        </header>

        {/* Summary cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Teams</p>
            <p className="mt-2 text-3xl font-bold text-blue-950">
              {teams.length}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Approved Teams</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Teams</p>
            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {pendingCount}
            </p>
          </div>
        </section>

        {/* Search and filter */}
        <section className="mt-8 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team, owner, email or city..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
            >
              <option value="ALL">All statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </section>

        {/* Team list */}
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-blue-950">
              Registered Teams
            </h2>
            <span className="text-sm text-gray-500">
              {filteredTeams.length} result(s)
            </span>
          </div>

          {filteredTeams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No teams found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Teams will appear here after Team Owner registrations are approved.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTeams.map((team) => (
                <article
                  key={team.id}
                  className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {team.teamLogoPath ? (
                        <img
                          src={team.teamLogoPath}
                          alt={`${team.teamName} logo`}
                          className="h-14 w-14 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                          {(team.teamShortName || team.teamName || "T")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-blue-950">
                          {team.teamName || "Unnamed Team"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {team.teamShortName || "No short name"}
                        </p>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(team.status)}`}>
                      {team.status || "Unknown"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">Owner:</span>{" "}
                      {team.ownerName || "Not available"}
                    </p>
                    <p className="truncate text-gray-600">
                      <span className="font-semibold text-gray-800">Email:</span>{" "}
                      {team.ownerEmail || "Not available"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">City:</span>{" "}
                      {team.teamCity || "Not specified"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold text-gray-800">Remaining budget:</span>{" "}
                      {formatCurrency(team.remainingBudget)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleViewTeam(team)}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    View Team Details
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Team detail panel */}
        {(detailsLoading || selectedTeam || detailError) && (
          <section className="mt-10 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-blue-950">
                Team Details
              </h2>

              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {detailsLoading && (
              <p className="mt-6 text-gray-600">Loading team details...</p>
            )}

            {detailError && (
              <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {detailError}
              </p>
            )}

            {success && (
              <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {success}
              </p>
            )}

            {selectedTeam && !detailsLoading && (
              <>
                {!editing ? (
                  <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["Team name", selectedTeam.teamName],
                        ["Short name", selectedTeam.teamShortName],
                        ["City", selectedTeam.teamCity],
                        ["Owner", selectedTeam.ownerName],
                        ["Owner email", selectedTeam.ownerEmail],
                        ["Owner phone", selectedTeam.ownerPhone],
                        ["Remaining budget", formatCurrency(selectedTeam.remainingBudget)],
                        ["Registration status", selectedTeam.status],
                        ["Registered on", formatDate(selectedTeam.registeredAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">{label}</p>
                          <p className="mt-1 break-words font-semibold text-gray-900">
                            {value || "Not available"}
                          </p>
                        </div>
                      ))}
                    </div>

                    {selectedTeam.teamDescription && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="mt-1 text-gray-800">
                          {selectedTeam.teamDescription}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(true);
                            setDetailError("");
                            setSuccess("");
                          }}
                          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                          Edit Team Details
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleUpdateTeam} className="mt-6 space-y-5">
                    {[
                      ["teamName", "Team Name", true],
                      ["teamShortName", "Team Short Name", true],
                      ["teamCity", "City", false],
                      ["teamLogoPath", "Team Logo Path", false],
                    ].map(([name, label, required]) => (
                      <div key={name}>
                        <label htmlFor={name} className="mb-2 block text-sm font-semibold text-gray-700">
                          {label}{required ? " *" : ""}
                        </label>
                        <input
                          id={name}
                          name={name}
                          value={form[name]}
                          onChange={handleFormChange}
                          required={required}
                          maxLength={name === "teamName" ? 100 : name === "teamShortName" ? 20 : name === "teamCity" ? 100 : 500}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                        />
                      </div>
                    ))}

                    <div>
                      <label htmlFor="teamDescription" className="mb-2 block text-sm font-semibold text-gray-700">
                        Team Description
                      </label>
                      <textarea
                        id="teamDescription"
                        name="teamDescription"
                        value={form.teamDescription}
                        onChange={handleFormChange}
                        maxLength={1000}
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                      />
                    </div>

                    <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      Owner identity, registration status and team budget cannot be changed here.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {saving ? "Saving..." : "Save Team Details"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setDetailError("");
                        }}
                        className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Team players */}
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-blue-950">
                    Team Players
                  </h3>

                  {players.length === 0 ? (
                    <p className="mt-4 rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
                      No players are currently associated with this team.
                    </p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-gray-600">
                            <th className="p-3">Player</th>
                            <th className="p-3">Player No.</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Registration Type</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Base Price</th>
                          </tr>
                        </thead>

                        <tbody>
                          {players.map((player) => (
                            <tr key={player.id} className="border-b last:border-0">
                              <td className="p-3 font-semibold text-gray-900">
                                {player.fullName || "Unnamed Player"}
                              </td>
                              <td className="p-3">{player.playerNumber ?? "—"}</td>
                              <td className="p-3">{player.playerRole || "—"}</td>
                              <td className="p-3">{player.registrationType || "—"}</td>
                              <td className="p-3">{player.status || "—"}</td>
                              <td className="p-3">
                                {player.basePrice != null
                                  ? formatCurrency(player.basePrice)
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default TeamManagement;
