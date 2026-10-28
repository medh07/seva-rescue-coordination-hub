import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import * as D from "./data";
import * as L from "./logic";
import flood1 from "@/assets/flood-1.jpg";

export interface Settings { name: string; language: string; smsAlerts: boolean; pushAlerts: boolean; offline: boolean; lowData: boolean; autoAssign: boolean; district: string; }
interface State {
  role: D.Role; incidents: D.Incident[]; teams: D.Team[]; shelters: D.Shelter[]; orgs: D.Org[]; tasks: D.Task[];
  resources: D.Resource[]; dispatches: D.Dispatch[]; alerts: D.Alert[]; cells: D.Cell[]; settings: Settings;
  offlineQueue: D.Incident[]; applications: { id: string; kind: string; name: string; at: number }[];
}
const KEY = "seva-demo-v1";
const ROLE_NAMES: Record<D.Role, string> = { "Operations Lead": "Riya Kaul", "Field Coordinator": "Arjun Mehta", "NGO Partner": "Ananya Sharma", Citizen: "Citizen User" };
export const roleName = (r: D.Role) => ROLE_NAMES[r];

const fresh = (): State => ({
  role: "Operations Lead", incidents: D.seedIncidents(), teams: D.seedTeams(), shelters: D.seedShelters(), orgs: D.seedOrgs(),
  tasks: D.seedTasks(), resources: D.seedResources(), dispatches: D.seedDispatches(), alerts: D.seedAlerts(), cells: D.seedCells(),
  settings: { name: "Riya Kaul", language: "English", smsAlerts: true, pushAlerts: true, offline: false, lowData: false, autoAssign: false, district: "All Districts" },
  offlineQueue: [], applications: [],
});

function useStoreImpl() {
  const [s, setS] = useState<State>(fresh);
  const hydrated = useRef(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setS({ ...fresh(), ...JSON.parse(raw) }); } catch { /* ignore */ }
    hydrated.current = true;
  }, []);
  useEffect(() => { if (hydrated.current) localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);

  const run = useCallback((fn: (s: State) => State, ok?: string) => {
    setS((prev) => {
      try { const n = fn(prev); if (ok) setTimeout(() => toast.success(ok), 0); return n; }
      catch (e) { setTimeout(() => toast.error((e as Error).message), 0); return prev; }
    });
  }, []);

  const actions = useMemo(() => ({
    setRole: (role: D.Role) => run((p) => ({ ...p, role, settings: { ...p.settings, name: ROLE_NAMES[role] } }), `Switched to ${role} view`),
    assign: (incId: string, teamId: string) => run((p) => ({ ...p, ...L.assignTeam(p.incidents, p.teams, incId, teamId) }), `Team dispatched to ${incId}`),
    quickDispatch: (incId: string) => run((p) => {
      const inc = p.incidents.find((i) => i.id === incId)!;
      const t = L.nearestAvailableTeam(inc, p.teams, inc.needs?.includes("Medical") ? "Medical" : "Boat");
      if (!t) throw new Error("No teams available right now");
      return { ...p, ...L.assignTeam(p.incidents, p.teams, incId, t.id) };
    }, `Nearest available team dispatched`),
    advance: (incId: string) => run((p) => ({ ...p, ...L.advanceIncident(p.incidents, p.teams, incId) }), `${incId} status updated`),
    submitSOS: (input: { id: string; name: string; phone: string; people: number; needs: string[]; details: string; district: string; lat: number; lng: number }) => {
      const id = input.id;
      run((p) => {
        const inc: D.Incident = {
          id, title: `${input.people} ${input.people === 1 ? "person" : "people"} need help`, details: input.details || "Citizen SOS — no details provided.",
          people: input.people, district: input.district, grid: "—", lat: input.lat, lng: input.lng, priority: L.priorityFromSOS(input.people, input.needs),
          reportedAt: Date.now(), status: "Received", img: flood1, source: "citizen", phone: input.phone, needs: input.needs, offline: p.settings.offline,
          history: [{ step: "Received", at: Date.now(), note: p.settings.offline ? "Queued offline (simulated SMS)" : "SOS from citizen" }],
        };
        if (p.settings.offline) return { ...p, offlineQueue: [inc, ...p.offlineQueue] };
        return { ...p, incidents: [inc, ...p.incidents] };
      }, `${id} sent`);
    },
    syncOffline: () => run((p) => ({ ...p, incidents: [...p.offlineQueue.map((i) => ({ ...i, offline: false })), ...p.incidents], offlineQueue: [] }), "Offline SOS reports synced"),
    setTaskStatus: (id: string, status: D.TaskStatus) => run((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }), `Task moved to ${status}`),
    addTask: (t: Omit<D.Task, "id" | "status" | "ago">) => run((p) => ({ ...p, tasks: [{ ...t, id: `K${Date.now()}`, status: "Available", ago: "just now" }, ...p.tasks] }), "Task posted to board"),
    requestOrg: (id: string) => run((p) => ({ ...p, orgs: p.orgs.map((o) => (o.id === id ? { ...o, requested: true } : o)) }), "Support request sent"),
    apply: (kind: string, name: string) => run((p) => ({ ...p, applications: [{ id: `AP${Date.now()}`, kind, name, at: Date.now() }, ...p.applications] }), "Verification request submitted"),
    dispatch: (rid: string, qty: number, dest: string, vehicle: string) => run((p) => ({ ...p, ...L.createDispatch(p.resources, p.dispatches, rid, qty, dest, vehicle) }), "Dispatch created"),
    advanceDispatch: (id: string) => run((p) => ({ ...p, dispatches: p.dispatches.map((d) => (d.id === id ? { ...d, status: d.status === "Packed" ? "In transit" : "Delivered" } : d)) }), "Dispatch updated"),
    restock: (rid: string, qty: number) => run((p) => ({ ...p, resources: p.resources.map((r) => (r.id === rid ? { ...r, stock: r.stock + qty } : r)) }), "Stock updated"),
    updateShelter: (id: string, delta: number) => run((p) => ({ ...p, shelters: p.shelters.map((x) => { if (x.id !== id) return x; const occ = Math.min(x.capacity, Math.max(0, x.occupied + delta)); return { ...x, occupied: occ, open: occ < x.capacity, updated: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) }; }) }), "Shelter occupancy updated"),
    addAlert: (a: Omit<D.Alert, "id" | "time">) => run((p) => ({ ...p, alerts: [{ ...a, id: `A${Date.now()}`, time: L.clock(Date.now()) }, ...p.alerts] }), a.source === "UNVERIFIED" ? "Report submitted for verification" : "Alert published"),
    verifyAlert: (id: string, src: D.AlertSource | "REJECT") => run((p) => ({ ...p, alerts: src === "REJECT" ? p.alerts.filter((a) => a.id !== id) : p.alerts.map((a) => (a.id === id ? { ...a, source: src } : a)) }), src === "REJECT" ? "Report dismissed as misinformation" : "Alert verified"),
    setSettings: (patch: Partial<Settings>) => run((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    reset: () => run(() => fresh(), "Demo data reset"),
  }), [run]);

  return { ...s, ...actions };
}

type Store = ReturnType<typeof useStoreImpl>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreImpl();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function nextSosId(s: { incidents: D.Incident[]; offlineQueue: D.Incident[] }) {
  const n = Math.max(0, ...s.incidents.map((i) => Number(i.id.slice(4)) || 0), ...s.offlineQueue.map((i) => Number(i.id.slice(4)) || 0)) + 1;
  return `SOS-${String(n).padStart(3, "0")}`;
}
export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}
