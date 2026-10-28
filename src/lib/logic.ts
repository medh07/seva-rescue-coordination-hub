import { STEPS, type Incident, type Team, type Priority, type Shelter, type Resource, type Dispatch } from "./data";

export const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export const tabOf = (s: Incident["status"]) =>
  s === "Received" || s === "Verified" ? "Active" : s === "Assigned" || s === "En route" ? "Assigned" : "Completed";

export function sortQueue(list: Incident[]) {
  return [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.reportedAt - a.reportedAt);
}

const dist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot(a.lat - b.lat, a.lng - b.lng);

export function nearestAvailableTeam(inc: Incident, teams: Team[], prefer?: Team["type"]) {
  const avail = teams.filter((t) => t.status === "Available");
  const pool = prefer ? avail.filter((t) => t.type === prefer) : avail;
  const list = pool.length ? pool : avail;
  return [...list].sort((a, b) => dist(a, inc) - dist(b, inc))[0];
}

/** Assign a team: incident -> Assigned, team -> Deployed. Fails if team busy. */
export function assignTeam(incidents: Incident[], teams: Team[], incId: string, teamId: string, now = Date.now()) {
  const team = teams.find((t) => t.id === teamId);
  const inc = incidents.find((i) => i.id === incId);
  if (!team || !inc) throw new Error("Not found");
  if (team.status !== "Available") throw new Error(`${team.name} is already deployed`);
  if (tabOf(inc.status) !== "Active") throw new Error(`${inc.id} is already ${inc.status.toLowerCase()}`);
  return {
    incidents: incidents.map((i) =>
      i.id === incId
        ? { ...i, status: "Assigned" as const, teamId, history: [...i.history.filter((h) => h.step === "Received" || h.step === "Verified"), ...(i.history.some((h) => h.step === "Verified") ? [] : [{ step: "Verified" as const, at: now, note: "Auto-verified on dispatch" }]), { step: "Assigned" as const, at: now, note: team.name }] }
        : i,
    ),
    teams: teams.map((t) => (t.id === teamId ? { ...t, status: "Deployed" as const } : t)),
  };
}

/** Advance incident one step; releasing the team once rescued. */
export function advanceIncident(incidents: Incident[], teams: Team[], incId: string, now = Date.now()) {
  const inc = incidents.find((i) => i.id === incId);
  if (!inc) throw new Error("Not found");
  const idx = STEPS.indexOf(inc.status);
  if (idx >= STEPS.length - 1) return { incidents, teams };
  if (STEPS[idx + 1] === "Assigned" && !inc.teamId) throw new Error("Assign a team first");
  const next = STEPS[idx + 1];
  return {
    incidents: incidents.map((i) => (i.id === incId ? { ...i, status: next, history: [...i.history, { step: next, at: now, note: next === "Verified" ? "Location confirmed" : next === "En route" ? "On way to location" : next === "Rescued" ? "People safe" : "Handed to medical team" }] } : i)),
    teams: next === "Rescued" ? teams.map((t) => (t.id === inc.teamId ? { ...t, status: "Available" as const } : t)) : teams,
  };
}

export const occupancy = (s: Shelter) => Math.round((s.occupied / s.capacity) * 100);

/** Dispatch reduces stock; cannot exceed stock or be non-positive. */
export function createDispatch(resources: Resource[], dispatches: Dispatch[], resourceId: string, qty: number, destination: string, vehicle: string, now = Date.now()) {
  const r = resources.find((x) => x.id === resourceId);
  if (!r) throw new Error("Unknown resource");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be more than 0");
  if (qty > r.stock) throw new Error(`Only ${r.stock} ${r.unit} in stock`);
  if (!destination.trim()) throw new Error("Choose a destination");
  const nextId = `D-${Math.max(100, ...dispatches.map((d) => Number(d.id.slice(2)) || 0)) + 1}`;
  return {
    resources: resources.map((x) => (x.id === resourceId ? { ...x, stock: x.stock - qty } : x)),
    dispatches: [{ id: nextId, resourceId, qty, destination, vehicle: vehicle || "Assigned on pickup", status: "Packed" as const, createdAt: now }, ...dispatches],
  };
}

export function priorityFromSOS(people: number, needs: string[]): Priority {
  if (needs.includes("Medical") && people >= 3) return "Critical";
  if (people >= 10) return "Critical";
  if (needs.includes("Medical") || people >= 4) return "High";
  if (people >= 2) return "Medium";
  return "Low";
}

export function minsAgo(ts: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}
export const clock = (ts: number) => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
