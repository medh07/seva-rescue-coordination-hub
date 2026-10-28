import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Building2, ChevronDown, Grid3x3, HandHeart, Home, LifeBuoy, Menu, Package, Search, Settings, ShieldCheck, Siren, Waves, WifiOff, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/data";

export const NAV = [
  { to: "/", label: "Command Centre", icon: Home, roles: ["Operations Lead", "Field Coordinator", "NGO Partner"] },
  { to: "/rescue", label: "Rescue Operations", icon: LifeBuoy, roles: ["Operations Lead", "Field Coordinator"] },
  { to: "/risk-grid", label: "Risk Grid", icon: Grid3x3, roles: ["Operations Lead", "Field Coordinator"] },
  { to: "/flood-search", label: "Flood Search", icon: Waves, roles: ["Operations Lead", "Field Coordinator"] },
  { to: "/ngos", label: "NGOs & Volunteers", icon: HandHeart, roles: ["Operations Lead", "Field Coordinator", "NGO Partner"] },
  { to: "/resources", label: "Resources", icon: Package, roles: ["Operations Lead", "Field Coordinator", "NGO Partner"] },
  { to: "/shelters", label: "Shelters & Medical", icon: Building2, roles: ["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"] },
  { to: "/updates", label: "Verified Updates", icon: ShieldCheck, roles: ["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"] },
  { to: "/sos", label: "Citizen SOS", icon: Siren, roles: ["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"] },
] as const;
const ROLES: Role[] = ["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2">
      <svg viewBox="0 0 40 40" className="h-9 w-9 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M20 4c6 7 12 12 12 19a12 12 0 0 1-24 0C8 16 14 11 20 4Z" />
        <path d="M13 25c3 3 11 3 14 0" />
      </svg>
      <div>
        <div className="font-display text-xl font-extrabold leading-none tracking-wide">SEVA</div>
        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.25em] text-primary">Response Intelligence</div>
      </div>
    </Link>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role, settings } = useStore();
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar px-3 py-5">
      <Logo />
      <nav className="flex flex-col gap-1">
        {NAV.filter((n) => (n.roles as readonly string[]).includes(role)).map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors", active ? "glow-active bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground", n.to === "/sos" && !active && "text-critical")}>
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 rounded-xl border border-border bg-card/60 p-3 text-xs">
        <div className="flex items-center gap-2 font-semibold"><span className={cn("h-2 w-2 rounded-full", settings.offline ? "bg-high" : "bg-success")} />{settings.offline ? "Offline mode (simulated)" : "System online"}</div>
        <p className="text-muted-foreground">All figures are demo data for training & evaluation.</p>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const { incidents, shelters, cells } = useStore();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return [
      ...incidents.filter((i) => `${i.id} ${i.district} ${i.title}`.toLowerCase().includes(t)).slice(0, 4).map((i) => ({ k: i.id, label: `${i.id} · ${i.title}`, sub: i.district, to: "/rescue" as const, search: { id: i.id } })),
      ...shelters.filter((s) => `${s.name} ${s.district}`.toLowerCase().includes(t)).slice(0, 3).map((s) => ({ k: s.id, label: s.name, sub: `Shelter · ${s.district}`, to: "/shelters" as const, search: { id: s.id } })),
      ...cells.filter((c) => c.id.toLowerCase() === t).map((c) => ({ k: c.id, label: `Grid ${c.id}`, sub: `${c.risk} risk`, to: "/risk-grid" as const, search: { cell: c.id } })),
    ];
  }, [q, incidents, shelters, cells]);
  return (
    <div className="relative hidden w-full max-w-md md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search locations, incidents, grid IDs..." className="h-10 w-full rounded-lg border border-border bg-card/70 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-12 z-[1000] overflow-hidden rounded-lg border border-border bg-popover shadow-2xl">
          {results.map((r) => (
            <Link key={r.k} to={r.to} search={r.search as never} onClick={() => setQ("")} className="block border-b border-border/50 px-3 py-2 text-sm hover:bg-secondary">
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.sub}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { role, setRole, settings, alerts, offlineQueue } = useStore();
  const [open, setOpen] = useState(false);
  const unverified = alerts.filter((a) => a.source === "UNVERIFIED").length;
  return (
    <header className="sticky top-0 z-[600] flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
      <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {settings.offline && <span className="hidden items-center gap-1 rounded-md border border-high/50 bg-high/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-high sm:flex"><WifiOff className="h-3 w-3" />Offline{offlineQueue.length ? ` · ${offlineQueue.length} queued` : ""}</span>}
        <span className="rounded-md border border-primary/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Demo data</span>
        <Link to="/updates" className="relative grid h-9 w-9 place-items-center rounded-lg hover:bg-secondary" aria-label="Alerts">
          <Bell className="h-5 w-5" />
          {unverified > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[9px] font-bold">{unverified}</span>}
        </Link>
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-secondary/60">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-info font-bold text-primary-foreground">{settings.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold leading-tight">{settings.name}</div>
              <div className="text-xs text-muted-foreground">{role}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-[1000] w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-2xl">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Switch role view</div>
              {ROLES.map((r) => (
                <button key={r} onClick={() => { setRole(r); setOpen(false); }} className={cn("block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary", r === role && "text-primary")}>{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mob, setMob] = useState(false);
  const { role, setRole } = useStore();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const item = NAV.find((n) => (n.to === "/" ? path === "/" : path.startsWith(n.to)));
  const allowed = !item || (item.roles as readonly string[]).includes(role);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border lg:block"><Sidebar /></aside>
      {mob && (
        <div className="fixed inset-0 z-[2000] lg:hidden">
          <div className="absolute inset-0 bg-background/70" onClick={() => setMob(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border">
            <button className="absolute right-3 top-5 z-10" onClick={() => setMob(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setMob(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMob(true)} />
        <main className="page-bg flex-1 p-4 md:p-6">
          {allowed ? children : (
            <div className="panel mx-auto mt-16 max-w-md p-8 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-3 text-xl font-bold">Restricted for {role}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item?.label} is available to response staff. Switch role to preview it.</p>
              <button onClick={() => setRole("Operations Lead")} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View as Operations Lead</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
