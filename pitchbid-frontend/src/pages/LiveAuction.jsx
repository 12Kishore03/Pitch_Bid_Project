import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAuctionById } from "../utils/AuctionStroage";
import { getRegistrationsByAuction } from "../utils/RegistrationStorage";
import { getOwnerRegistrationsByAuction } from "../utils/OwnerRegistrationStorage";

const KEY = "pitchbid_live_";
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const readState = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function LiveAuction() {
  const { auctionId } = useParams();
  const auction = getAuctionById(auctionId);
  const key = `${KEY}${auctionId}`;
  const saved = readState(key);
  const registeredPlayers = useMemo(() => getRegistrationsByAuction(auctionId).filter(p => p.status === "Approved"), [auctionId]);
  const registeredOwners = useMemo(() => getOwnerRegistrationsByAuction(auctionId).filter(t => t.status === "Approved"), [auctionId]);
  const initialPlayers = useMemo(() => registeredPlayers.map(p => ({ ...p, id: String(p.id || p.email), basePrice: Number(p.basePrice || 0) })), [registeredPlayers]);
  const initialTeams = useMemo(() => registeredOwners.map(t => ({ id: String(t.id || t.owner?.email), teamName: t.team?.teamName || "Unnamed team", shortName: t.team?.teamShortName || "", ownerName: t.owner?.fullName || "", budget: Number(auction?.teamBudget || 0), spent: 0, bought: 0 })), [registeredOwners, auction?.teamBudget]);
  const [teams, setTeams] = useState(() => saved?.teams || initialTeams);
  const [players, setPlayers] = useState(() => saved?.players || initialPlayers);
  const [results, setResults] = useState(() => saved?.results || []);
  const [phase, setPhase] = useState(() => saved?.phase || "ready");
  const [round, setRound] = useState(() => saved?.round || 1);
  const [playerId, setPlayerId] = useState(() => saved?.playerId || "");
  const [bid, setBid] = useState(() => saved?.bid || 0);
  const [highestTeamId, setHighestTeamId] = useState(() => saved?.highestTeamId || "");
  const [teamId, setTeamId] = useState("");
  const [seconds, setSeconds] = useState(() => saved?.seconds ?? Number(auction?.bidTimer || 20));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const timer = Math.max(5, Number(auction?.bidTimer || 20));
  const increment = Math.max(1, Number(auction?.bidIncrement || 1));
  const maxRoster = Number(auction?.maxPlayers || 0);
  const current = players.find(p => p.id === playerId);
  const highestTeam = teams.find(t => t.id === highestTeamId);
  const unsold = players.filter(p => p.auctionStatus === "Unsold");
  const pending = players.filter(p => !p.auctionStatus);
  const bidding = phase === "bidding";
  const locked = phase === "decision";
  const teamsWithEligibility = teams.map(t => {
    const remaining = t.budget - t.spent;
    const next = highestTeamId ? bid + increment : Number(current?.basePrice || 0);
    const full = maxRoster > 0 && t.bought >= maxRoster;
    return { ...t, remaining, eligible: remaining >= next && !full, reason: full ? "Roster limit reached" : remaining < next ? "Insufficient budget for next bid" : "" };
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ teams, players, results, phase, round, playerId, bid, highestTeamId, seconds }));
  }, [key, teams, players, results, phase, round, playerId, bid, highestTeamId, seconds]);
  useEffect(() => {
    if (!bidding) return;
    const id = window.setInterval(() => setSeconds(s => {
      if (s <= 1) { window.clearInterval(id); setPhase("decision"); setMessage("Timer expired. Bidding is locked; finalize the outcome."); return 0; }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [bidding]);

  const choosePlayer = (p, newRound = round) => { setPlayerId(p.id); setBid(Number(p.basePrice || 0)); setHighestTeamId(""); setTeamId(""); setRound(newRound); setSeconds(timer); setPhase("selected"); setError(""); setMessage(`${p.fullName} selected. Start bidding when ready.`); };
  const start = () => { if (!current) return setError("Select a player first."); setSeconds(timer); setPhase("bidding"); setError(""); setMessage(`Bidding started for ${current.fullName}.`); };
  const raise = () => {
    if (!bidding || seconds <= 0) return setError("Bidding is not active.");
    const team = teamsWithEligibility.find(t => t.id === teamId);
    if (!team) return setError("Select the team whose owner raised their hand.");
    if (!team.eligible) return setError(team.reason || "This team cannot bid.");
    const amount = highestTeamId ? bid + increment : Number(current.basePrice || 0);
    if (team.remaining < amount) return setError("Insufficient team budget.");
    setBid(amount); setHighestTeamId(team.id); setSeconds(timer); setError(""); setMessage(`${team.shortName || team.teamName} is highest at ${money(amount)}.`);
  };
  const finalize = () => {
    if (!current || !highestTeamId) return setError("No highest bidder. Mark the player unsold instead.");
    const t = teams.find(team => team.id === highestTeamId);
    if (!window.confirm(`Sell ${current.fullName} to ${t.teamName} for ${money(bid)}?`)) return;
    const now = new Date();
    const result = { id: `OUT-${Date.now()}`, player: { ...current }, playerId: current.id, playerName: current.fullName, teamId: t.id, teamName: t.teamName, shortName: t.shortName, basePrice: current.basePrice, soldPrice: bid, round, status: "Sold", date: now.toLocaleDateString("en-IN"), time: now.toLocaleTimeString("en-IN"), initialBudget: t.budget, previousSpending: t.spent, balanceBefore: t.budget - t.spent, balanceAfter: t.budget - t.spent - bid };
    setTeams(old => old.map(team => team.id === t.id ? { ...team, spent: team.spent + bid, bought: team.bought + 1 } : team));
    setPlayers(old => old.map(p => p.id === current.id ? { ...p, auctionStatus: "Sold", soldPrice: bid, soldToTeamId: t.id } : p));
    setResults(old => [...old, result]); setPhase("result"); setMessage(`${current.fullName} sold to ${t.teamName} for ${money(bid)}.`); setError("");
  };
  const markUnsold = () => {
    if (!current || !window.confirm(`Mark ${current.fullName} unsold?`)) return;
    const now = new Date();
    setPlayers(old => old.map(p => p.id === current.id ? { ...p, auctionStatus: "Unsold" } : p));
    setResults(old => [...old, { id: `OUT-${Date.now()}`, player: { ...current }, playerId: current.id, playerName: current.fullName, basePrice: current.basePrice, round, status: "Unsold", date: now.toLocaleDateString("en-IN"), time: now.toLocaleTimeString("en-IN") }]);
    setPhase("result"); setMessage(`${current.fullName} marked unsold.`); setError("");
  };
  const nextPlayer = () => { setPlayerId(""); setBid(0); setHighestTeamId(""); setTeamId(""); setSeconds(timer); setPhase("ready"); setError(""); setMessage("Select the next player."); };
  const reentry = () => { if (!unsold.length) return setError("No unsold players available."); setRound(r => r + 1); setPhase("reentry"); setPlayerId(""); setBid(0); setHighestTeamId(""); setTeamId(""); setMessage("Choose an unsold player for re-entry."); setError(""); };
  const chooseRandomPlayer = () => { const pool = phase === "reentry" ? unsold : pending; if (!pool.length) return setError("No eligible players are available."); const picked = pool[Math.floor(Math.random() * pool.length)]; choosePlayer(picked, phase === "reentry" ? round : 1); };
  const finish = () => {
    if (["bidding", "decision", "paused", "selected"].includes(phase)) return setError("Resolve the current player before finishing.");
    if (pending.length) return setError("Every eligible player needs an outcome before finishing.");
    if (auction.playerReentry === "Allow" && unsold.length > 0 && round === 1) return setError("Run the unsold-player re-entry round before finishing the auction.");
    if (!window.confirm("Finish the auction and lock final outcomes?")) return;
    setPhase("completed"); setMessage("Auction completed. Final reports are ready."); setError("");
  };
  const exportExcelCsv = () => {
    if (phase !== "completed") return setError("Finish the auction before exporting.");
    const headers = ["S.No.", "Player ID", "Player Name", "Jersey Name", "Age", "Role", "Batting Style", "Bowling Style", "Wicketkeeper", "Base Price", "Round", "Short Team Name", "Full Team Name", "Highest Bid / Sold Price", "Purchase Date", "Purchase Time", "Initial Team Budget", "Previous Spending", "Balance Before Purchase", "Current Purchase Amount", "Balance After Purchase", "Status", "Email", "Phone", "City"];
    const rows = results.map((r, i) => { const p = r.player || {}; return [i + 1, r.playerId, r.playerName, p.jerseyName, p.age, p.playerRole, p.battingStyle, p.bowlingStyle, p.wicketkeeper, r.basePrice, r.round, r.shortName, r.teamName, r.soldPrice, r.status === "Sold" ? r.date : "", r.status === "Sold" ? r.time : "", r.initialBudget, r.previousSpending, r.balanceBefore, r.status === "Sold" ? r.soldPrice : "", r.balanceAfter, r.status, p.email, p.phone, p.city]; });
    downloadCsv(`${(auction?.auctionName || "PitchBid").replace(/[^a-z0-9-_]/gi, "_")}_results.csv`, [headers, ...rows]);
    setMessage("CSV opened by Excel-compatible apps. For .xlsx, open it in Excel and choose Save As → Excel Workbook."); setError("");
  };

  if (!auction) return <main className="min-h-screen bg-blue-50 p-8"><div className="mx-auto max-w-xl rounded-2xl bg-white p-8"><h1 className="text-2xl font-bold text-blue-950">Auction not found</h1><Link className="mt-4 inline-block text-blue-700" to="/dashboard">Back to Dashboard</Link></div></main>;
  if (!teams.length || !players.length) return <main className="min-h-screen bg-blue-50 p-8"><div className="mx-auto max-w-2xl rounded-2xl bg-white p-8"><Link className="text-blue-700" to={`/auction-management/${auctionId}`}>← Auction Management</Link><h1 className="mt-5 text-2xl font-bold text-blue-950">Live auction is not ready</h1><p className="mt-3 text-gray-600">Approve at least one player and one team owner before starting.</p><p className="mt-3">Approved players: {initialPlayers.length} · Approved teams: {initialTeams.length}</p></div></main>;

  return (
    <main className="h-[100dvh] overflow-hidden bg-blue-50 p-3 text-slate-800 print:h-auto print:overflow-visible print:bg-white sm:p-4">
      <style>{`
        .pitchbid-screen { height: calc(100dvh - 2rem); min-height: 0; }
        .pitchbid-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; }
        @media (max-height: 760px) {
          .pitchbid-screen { height: calc(100dvh - 1.5rem); }
          .pitchbid-card { padding: .75rem !important; }
          .pitchbid-section-title { font-size: 1rem !important; }
          .pitchbid-stat { padding: .5rem !important; }
        }
        @media print {
          .no-print { display: none !important; }
          .pitchbid-screen { height: auto !important; overflow: visible !important; }
          .pitchbid-scroll { overflow: visible !important; }
          main { height: auto !important; overflow: visible !important; }
        }
      `}</style>

      <div className="pitchbid-screen mx-auto flex max-w-[1800px] flex-col gap-3">
        {/* Compact header */}
        <header className="flex shrink-0 items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">PitchBid · Live Auction</p>
            <h1 className="truncate text-lg font-extrabold text-blue-950 sm:text-xl">{auction.auctionName}</h1>
            <p className="text-xs text-slate-500">Auction ID: {auction.id}</p>
          </div>
          <div className="no-print flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 sm:inline">
              {phase === "completed" ? "Completed" : `Round ${round}`}
            </span>
            <Link className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:text-sm" to={`/auction-management/${auctionId}`}>
              ← Management
            </Link>
          </div>
        </header>

        {/* Status messages remain visible without pushing the whole page to scroll */}
        {(error || message) && (
          <div className={`shrink-0 rounded-lg px-3 py-2 text-sm ${error ? "border border-amber-200 bg-amber-50 text-amber-900" : "border border-blue-100 bg-white text-blue-800"}`}>
            <span className="font-semibold">{error ? "Action needed: " : ""}</span>{error || message}
          </div>
        )}

        {/* Summary strip */}
        <section className="grid shrink-0 grid-cols-4 gap-2">
          {[
            ["Teams", teams.length],
            ["Players remaining", pending.length],
            ["Finalized outcomes", results.length],
            ["Time", `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`],
          ].map(([label, value]) => (
            <div key={label} className="pitchbid-stat rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
              <p className={`mt-0.5 truncate text-lg font-extrabold sm:text-xl ${label === "Time" && seconds <= 5 && bidding ? "text-amber-700" : "text-blue-950"}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* Main area: player is always visible; long queues/results scroll inside their own panels */}
        {phase !== "completed" ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
            <section className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm pitchbid-card sm:p-4">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <h2 className="pitchbid-section-title text-lg font-bold text-blue-950">Current Player</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${bidding ? "bg-green-100 text-green-800" : locked ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-800"}`}>
                  {bidding ? "Bidding live" : locked ? "Bidding locked" : phase === "paused" ? "Paused" : phase === "result" ? "Outcome finalized" : phase === "reentry" ? "Re-entry round" : "Ready"}
                </span>
              </div>

              {current ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                  {/* Full essential player details */}
                  <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(155px,.72fr)] gap-3">
                    <div className="min-w-0 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{current.playerRole || "Cricket Player"}</p>
                      <h3 className="mt-1 break-words text-xl font-extrabold leading-tight text-blue-950 sm:text-2xl">{current.fullName || "Unnamed player"}</h3>
                      {current.jerseyName && <p className="mt-1 text-sm text-slate-600">Jersey: {current.jerseyName}</p>}
                      <p className="mt-2 text-sm text-slate-600">{current.city || "City not provided"}{current.age ? ` · Age ${current.age}` : ""}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[11px] text-slate-500">Base price</p>
                          <p className="text-base font-extrabold text-blue-950 sm:text-lg">{money(current.basePrice)}</p>
                        </div>
                        <div className="rounded-lg bg-white p-2">
                          <p className="text-[11px] text-slate-500">Player ID</p>
                          <p className="truncate text-sm font-bold text-blue-950">{current.id}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:text-sm">
                        <p><span className="text-slate-500">Batting:</span> <b>{current.battingStyle || "—"}</b></p>
                        <p><span className="text-slate-500">Bowling:</span> <b>{current.bowlingStyle || "—"}</b></p>
                        <p><span className="text-slate-500">Wicketkeeper:</span> <b>{current.wicketkeeper ? "Yes" : "No"}</b></p>
                        {current.phone && <p className="truncate"><span className="text-slate-500">Phone:</span> <b>{current.phone}</b></p>}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-center gap-3 rounded-xl bg-blue-950 p-3 text-white sm:p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Time remaining</p>
                        <p className={`mt-1 font-mono text-3xl font-black tabular-nums sm:text-4xl ${bidding && seconds <= 5 ? "text-amber-300" : "text-white"}`}>
                          {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
                        </p>
                        <p className="text-xs text-blue-200">{bidding ? "Countdown running" : locked ? "Time expired" : phase === "paused" ? "Timer paused" : `Timer set to ${timer}s`}</p>
                      </div>
                      <div className="border-t border-blue-800 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Highest bid</p>
                        <p className="mt-1 text-2xl font-black sm:text-3xl">{money(bid)}</p>
                        <p className="truncate text-xs text-blue-200">{highestTeam?.teamName || "No team has bid yet"}</p>
                      </div>
                      <div className="border-t border-blue-800 pt-3">
                        <p className="text-xs text-blue-200">Next bid amount</p>
                        <p className="text-lg font-bold">{money(highestTeamId ? bid + increment : current.basePrice)}</p>
                        <p className="text-xs text-blue-200">Increment: {money(increment)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Creator controls */}
                  <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
                    {["selected", "ready", "reentry"].includes(phase) && (
                      <button onClick={start} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Start Bidding</button>
                    )}
                    {bidding && (
                      <>
                        <button onClick={raise} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Raise Bid +{money(increment)}</button>
                        <button onClick={() => setPhase("paused")} className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Pause</button>
                      </>
                    )}
                    {phase === "paused" && (
                      <button onClick={() => seconds > 0 ? setPhase("bidding") : setPhase("decision")} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Resume</button>
                    )}
                    {(locked || phase === "paused") && (
                      <>
                        <button disabled={!highestTeamId} onClick={finalize} className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40">Finalize Sale</button>
                        <button onClick={markUnsold} className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Mark Unsold</button>
                      </>
                    )}
                    {phase === "result" && (
                      <button onClick={nextPlayer} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Next Player</button>
                    )}
                  </div>
                  {locked && <p className="shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Timer expired. Bidding is locked until the Creator finalizes the outcome.</p>}
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4 text-center">
                  <h3 className="text-lg font-bold text-blue-950">Select the next player</h3>
                  <p className="mt-1 text-sm text-slate-600">Choose a player from the list below. Their details and bidding controls will appear here.</p>
                </div>
              )}

              {/* Player queue: internal scroll only */}
              <div className="flex min-h-0 flex-1 flex-col border-t border-slate-100 pt-3">
                <div className="no-print mb-2 flex shrink-0 items-center justify-between gap-2">
                  <h3 className="font-bold text-blue-950">{phase === "reentry" ? `Unsold players · Re-entry (${unsold.length})` : `Eligible players (${pending.length})`}</h3>
                  <button onClick={chooseRandomPlayer} disabled={!(phase === "reentry" ? unsold : pending).length} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-40">Pick Randomly</button>
                </div>
                <div className="pitchbid-scroll grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(phase === "reentry" ? unsold : pending).map(p => (
                    <button key={p.id} onClick={() => choosePlayer(p, phase === "reentry" ? round : 1)} className={`rounded-lg border p-2 text-left ${playerId === p.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 hover:bg-blue-50"}`}>
                      <span className="block truncate text-sm font-bold text-blue-950">{p.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{p.playerRole || "Player"} · Base {money(p.basePrice)}</span>
                    </button>
                  ))}
                  {!(phase === "reentry" ? unsold : pending).length && <p className="col-span-full py-2 text-sm text-slate-500">No players in this list.</p>}
                </div>
                <div className="no-print mt-2 flex shrink-0 flex-wrap gap-2">
                  {phase !== "reentry" && unsold.length > 0 && auction.playerReentry === "Allow" && (
                    <button onClick={reentry} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Start Unsold Re-entry ({unsold.length})</button>
                  )}
                  <button onClick={finish} disabled={["bidding", "decision", "paused", "selected"].includes(phase)} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40">Finish Auction</button>
                </div>
              </div>
            </section>

            {/* Teams and budgets */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm pitchbid-card sm:p-4">
              <div className="shrink-0">
                <h2 className="pitchbid-section-title text-lg font-bold text-blue-950">Teams & Budgets</h2>
                <p className="mt-1 text-xs text-slate-600">Select the team whose owner raised their hand. Ineligible teams cannot be selected.</p>
                <label className="mt-3 block text-xs font-bold text-slate-700" htmlFor="interested-team">Interested team</label>
                <select id="interested-team" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!bidding} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100">
                  <option value="">Select team</option>
                  {teamsWithEligibility.map(t => <option key={t.id} value={t.id} disabled={!t.eligible}>{t.shortName ? `${t.shortName} — ` : ""}{t.teamName} · {money(t.remaining)}{t.reason ? ` — ${t.reason}` : ""}</option>)}
                </select>
              </div>

              <div className="pitchbid-scroll mt-3 flex-1 space-y-2">
                {teamsWithEligibility.map(t => (
                  <div key={t.id} className={`rounded-xl border p-3 ${t.id === highestTeamId ? "border-green-300 bg-green-50" : t.eligible ? "border-blue-100 bg-white" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-blue-950">{t.shortName ? `${t.shortName} · ` : ""}{t.teamName}</p>
                        <p className="truncate text-xs text-slate-500">{t.ownerName || "Team owner"} · {t.bought} purchased</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${t.id === highestTeamId ? "bg-green-100 text-green-800" : t.eligible ? "bg-blue-50 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
                        {t.id === highestTeamId ? "Highest bidder" : t.eligible ? "Eligible" : "Unavailable"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                        <p className="text-[10px] text-slate-500">Remaining budget</p>
                        <p className="text-sm font-extrabold text-blue-950">{money(t.remaining)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                        <p className="text-[10px] text-slate-500">Spent so far</p>
                        <p className="text-sm font-bold text-slate-700">{money(t.spent)}</p>
                      </div>
                    </div>
                    {t.reason && <p className="mt-1 text-xs text-slate-500">{t.reason}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-blue-950">Auction Completed</h2>
                <p className="text-sm text-slate-600">All required player outcomes have been finalized.</p>
              </div>
              <div className="no-print flex flex-wrap gap-2">
                <button onClick={exportExcelCsv} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800">Download Excel-compatible CSV</button>
                <button onClick={() => window.print()} className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">Print / Save PDF</button>
              </div>
            </div>
            <div className="pitchbid-scroll mt-3 flex-1 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-blue-50 text-blue-950"><tr>{["Player","Round","Team","Final price","Time","Status"].map(h => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
                <tbody>{results.map(r => <tr key={r.id} className="border-b border-slate-100"><td className="px-3 py-2">{r.playerName}</td><td className="px-3 py-2">{r.round}</td><td className="px-3 py-2">{r.teamName || "—"}</td><td className="px-3 py-2">{r.status === "Sold" ? money(r.soldPrice) : "—"}</td><td className="px-3 py-2">{r.time || "—"}</td><td className="px-3 py-2">{r.status}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        )}

        {/* Compact results strip stays on-screen; its rows scroll internally when long */}
        {phase !== "completed" && (
          <section className="flex h-[135px] shrink-0 flex-col overflow-hidden rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="font-bold text-blue-950">Finalized Outcomes <span className="text-xs font-medium text-slate-500">({results.length})</span></h2>
              <div className="no-print flex items-center gap-2">
                <span className="hidden text-xs text-slate-500 sm:inline">{pending.length} players remaining</span>
                <button onClick={exportExcelCsv} disabled={phase !== "completed"} title="Available after finishing the auction" className="rounded border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 disabled:opacity-40">CSV after completion</button>
                <button onClick={() => window.print()} className="rounded border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700">Print</button>
              </div>
            </div>
            <div className="pitchbid-scroll mt-2 flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-blue-50 text-blue-950"><tr>{["Player","Round","Purchasing team","Final price","Time","Status"].map(h => <th key={h} className="whitespace-nowrap px-2 py-1.5">{h}</th>)}</tr></thead>
                <tbody>{results.map(r => <tr key={r.id} className="border-b border-slate-100"><td className="max-w-[180px] truncate px-2 py-1.5">{r.playerName}</td><td className="px-2 py-1.5">{r.round}</td><td className="max-w-[180px] truncate px-2 py-1.5">{r.teamName || "—"}</td><td className="whitespace-nowrap px-2 py-1.5">{r.status === "Sold" ? money(r.soldPrice) : "—"}</td><td className="whitespace-nowrap px-2 py-1.5">{r.time || "—"}</td><td className="px-2 py-1.5">{r.status}</td></tr>)}</tbody>
              </table>
              {!results.length && <p className="py-2 text-xs text-slate-500">Finalized player outcomes will appear here.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
