import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Building2, HandHeart, Package, Siren, Truck, Users, Grid3x3, LifeBuoy, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { GeoMap, MapLegend, type Pin } from "@/components/GeoMap";
import { Button, Panel, PriorityTag, Stat, Tag } from "@/components/seva";
import { useStore } from "@/lib/store";
import { RIVER, TOWNS, MEDICAL } from "@/lib/data";
import { minsAgo, sortQueue, tabOf } from "@/lib/logic";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => meta("Command Centre", "Live situational overview of SOS reports, critical grids, rescue teams and shelters across Assam."),
  component: CommandCentre,
});

const LAYERS = ["Population Heat", "Flood Extent", "Risk Grid", "Shelters", "Rescue Teams"] as const;
type Layer = (typeof LAYERS)[number];

function CommandCentre() {
  const s = useStore();
  const [layers, setLayers] = useState<Set<Layer>>(new Set(["Population Heat", "Flood Extent", "Shelters", "Rescue Teams"]));
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const active = s.incidents.filter((i) => tabOf(i.status) === "Active");
  const queue = sortQueue(active);
  const critCells = s.cells.filter((c) => c.risk === "Critical" || c.risk === "High").length;
  const deployed = s.teams.filter((t) => t.status === "Deployed").length;
  const toggle = (l: Layer) => setLayers((p) => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n; });

  const pins = useMemo<Pin[]>(() => [
    ...TOWNS.map(([n, lat, lng]) => ({ id: n, lat, lng, kind: "town" as const, label: n })),
    ...s.incidents.filter((i) => tabOf(i.status) !== "Completed").map((i) => ({ id: i.id, lat: i.lat, lng: i.lng, kind: "sos" as const, text: "SOS", tip: `${i.id} · ${i.title}`, pulse: i.priority === "Critical", variant: i.priority === "Medium" ? ("medium" as const) : i.priority === "Low" ? ("low" as const) : undefined })),
    ...(layers.has("Shelters") ? s.shelters.map((x) => ({ id: x.id, lat: x.lat, lng: x.lng, kind: "shelter" as const, text: "⌂", tip: `${x.name} · ${x.capacity - x.occupied} spaces` })) : []),
    ...(layers.has("Shelters") ? MEDICAL.map((x) => ({ id: x.id, lat: x.lat, lng: x.lng, kind: "medical" as const, text: "+", tip: x.name })) : []),
    ...(layers.has("Rescue Teams") ? s.teams.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, kind: "team" as const, text: "⛵", tip: `${t.name} · ${t.status}` })) : []),
  ], [s.incidents, s.shelters, s.teams, layers]);

  const heat = layers.has("Population Heat") ? [
    { lat: 26.05, lng: 90.1, radius: 32000, color: "--critical", opacity: 0.32 }, { lat: 26.3, lng: 91.1, radius: 28000, color: "--high", opacity: 0.3 },
    { lat: 26.3, lng: 92.4, radius: 36000, color: "--critical", opacity: 0.32 }, { lat: 26.7, lng: 93.7, radius: 30000, color: "--high", opacity: 0.28 },
    { lat: 26.2, lng: 91.7, radius: 22000, color: "--medium", opacity: 0.28 }, { lat: 27.4, lng: 94.8, radius: 26000, color: "--medium", opacity: 0.25 },
  ] : [];
  const grid = layers.has("Risk Grid") ? s.cells.filter((c) => c.risk !== "None").map((c) => {
    const lat = 26.9 - c.row * 0.14, lng = 92.0 + c.col * 0.175;
    return { id: c.id, bounds: [[lat, lng], [lat - 0.14, lng + 0.175]] as [[number, number], [number, number]], color: `--${c.risk.toLowerCase()}`, opacity: 0.3 };
  }) : [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Command Centre · Assam Floods</div>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl">Every second matters.</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time visibility. Coordinated response. Lives saved.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat tone="critical" icon={<Siren className="h-5 w-5" />} value={active.length} label="SOS Reports" sub="Active" />
          <Stat tone="high" icon={<AlertTriangle className="h-5 w-5" />} value={critCells} label="Critical Grids" sub="High risk" />
          <Stat icon={<Users className="h-5 w-5" />} value={deployed} label="Active Teams" sub="On ground" />
          <Stat tone="success" icon={<Building2 className="h-5 w-5" />} value={s.shelters.filter((x) => x.open).length} label="Shelters" sub="Open" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="panel relative h-[520px] overflow-hidden p-0">
          <div className="absolute left-3 right-3 top-3 z-[500] flex flex-wrap gap-2">
            {LAYERS.map((l) => (
              <button key={l} onClick={() => toggle(l)} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur", layers.has(l) ? "border-primary bg-primary/20 text-primary" : "border-border bg-popover/80 text-muted-foreground")}>{l}</button>
            ))}
          </div>
          <GeoMap center={[26.4, 92.3]} zoom={7} fitTo={focus} pins={pins} circles={heat} rects={grid}
            lines={[...(layers.has("Flood Extent") ? [{ points: RIVER, color: "--info", weight: 26, opacity: 0.35 }] : []), { points: RIVER, color: "--primary", weight: 3, opacity: 0.8 }]} />
          <MapLegend className="bottom-3 left-3" items={[{ label: "SOS report", swatch: "--critical" }, { label: "Rescue team", swatch: "--info" }, { label: "Shelter", swatch: "--success", shape: "square" }, { label: "Flood extent", swatch: "--info", shape: "line" }, { label: "High population exposure", swatch: "--high" }]} />
        </div>

        <Panel title="Live Rescue Queue" action={<Tag tone="critical">{queue.length} pending</Tag>} className="flex max-h-[520px] flex-col">
          <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
            {queue.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Queue clear — all SOS reports assigned.</p>}
            {queue.map((i) => (
              <div key={i.id} className="rounded-lg border border-border bg-background/40 p-3 hover:border-primary/50">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setFocus([i.lat, i.lng])} className="text-left text-sm font-semibold hover:text-primary">{i.id}</button>
                  <PriorityTag p={i.priority} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.details}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">{i.district} · {minsAgo(i.reportedAt)}</span>
                  {s.role === "NGO Partner" ? <Link to="/rescue" search={{ id: i.id }} className="text-xs text-primary">View</Link> : <Button size="sm" variant={i.priority === "Critical" ? "danger" : "outline"} onClick={() => s.quickDispatch(i.id)}>Dispatch</Button>}
                </div>
              </div>
            ))}
          </div>
          <Link to="/rescue" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-primary">Open Rescue Operations <ArrowRight className="h-4 w-4" /></Link>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel title="NGO & Volunteer Resources" action={<Link to="/ngos" className="text-xs font-semibold text-primary">View all</Link>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { i: HandHeart, v: s.orgs.length, l: "NGOs", sub: "Active" },
              { i: Users, v: s.orgs.reduce((a, o) => a + o.volunteers, 0) + 160, l: "Volunteers", sub: "On ground" },
              { i: Truck, v: s.dispatches.filter((d) => d.status !== "Delivered").length + 32, l: "Relief Vehicles", sub: "Deployed" },
              { i: Package, v: `${(s.resources.find((r) => r.id === "R1")!.stock / 336).toFixed(1)}T`, l: "Materials", sub: "Dispatched" },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-border bg-background/40 p-3">
                <x.i className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-2xl font-bold">{x.v}</div>
                <div className="text-sm">{x.l}</div>
                <div className="text-xs text-muted-foreground">{x.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {[{ to: "/rescue", l: "Rescue Ops", i: LifeBuoy }, { to: "/risk-grid", l: "Risk Grid", i: Grid3x3 }, { to: "/resources", l: "Dispatch supplies", i: Package }, { to: "/shelters", l: "Shelters", i: Building2 }].map((q) => (
              <Link key={q.to} to={q.to} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-primary hover:text-primary"><q.i className="h-4 w-4" />{q.l}</Link>
            ))}
          </div>
        </Panel>
        <Panel title="Verified Updates" action={<Link to="/updates" className="text-xs font-semibold text-primary">View all</Link>}>
          <div className="space-y-2">
            {s.alerts.filter((a) => a.source !== "UNVERIFIED").slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3">
                <ShieldCheck className={cn("mt-0.5 h-4 w-4 shrink-0", a.source === "GOVT" ? "text-info" : "text-success")} />
                <div className="min-w-0 flex-1 text-sm">{a.text}</div>
                <div className="shrink-0 text-right">
                  <Tag tone={a.source === "GOVT" ? "info" : "low"}>{a.source}</Tag>
                  <div className="mt-1 text-[11px] text-muted-foreground">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
