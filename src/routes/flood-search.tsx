import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Info, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GeoMap, MapLegend } from "@/components/GeoMap";
import { Button, Label, Panel, SimLabel, Tag, field } from "@/components/seva";
import { RIVER, TOWNS } from "@/lib/data";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/flood-search")({
  head: () => meta("Flood Search Intelligence", "Illustrative downstream search-sector modelling to support missing-person search teams. Not a person-location prediction."),
  component: FloodSearch,
});

const PLACES: Record<string, [number, number]> = { "Nimatighat, Jorhat": [26.86, 94.24], "Majuli Ghat": [26.95, 94.17], "Tezpur Ghat": [26.6, 92.8], "Dibrugarh Ghat": [27.48, 94.9] };
const FLOW = { Low: 1.2, Moderate: 2.4, High: 3.6 } as const;

/** walk downstream along RIVER from start for km kilometres */
function downstream(start: [number, number], km: number): [number, number] {
  let i = 0, best = Infinity;
  RIVER.forEach((p, k) => { const d = Math.hypot(p[0] - start[0], p[1] - start[1]); if (d < best) { best = d; i = k; } });
  let left = km, cur: [number, number] = RIVER[i];
  for (let k = i; k < RIVER.length - 1 && left > 0; k++) {
    const a = RIVER[k], b = RIVER[k + 1];
    const seg = Math.hypot((b[0] - a[0]) * 111, (b[1] - a[1]) * 100);
    if (seg >= left) { const t = left / seg; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    left -= seg; cur = b;
  }
  return cur;
}

function FloodSearch() {
  const [place, setPlace] = useState("Nimatighat, Jorhat");
  const [seen, setSeen] = useState("2024-06-18T06:30");
  const [extent, setExtent] = useState("Sentinel-1 (18 Jun, 05:45)");
  const [fresh, setFresh] = useState("Updated 2 hrs ago");
  const [flow, setFlow] = useState<keyof typeof FLOW>("Moderate");
  const [hours, setHours] = useState(12);
  const [play, setPlay] = useState(false);
  const [generated, setGenerated] = useState(true);
  const start = PLACES[place];

  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setHours((h) => { if (h >= 72) { setPlay(false); return 72; } return h + 2; }), 250);
    return () => clearInterval(t);
  }, [play]);

  const f = FLOW[flow];
  const sectors = useMemo(() => [
    { k: "A", from: 5, to: 12, likely: "Higher", tone: "high" as const, area: "Riverbanks and shallow inundated areas" },
    { k: "B", from: 12, to: 28, likely: "Moderate", tone: "medium" as const, area: "Downstream channels, floodplain edges" },
    { k: "C", from: 28, to: 50, likely: "Lower", tone: "low" as const, area: "Further downstream, braided channels" },
  ].map((x) => { const sc = f / 2.4; const from = Math.round(x.from * sc), to = Math.round(x.to * sc); const mid = downstream(start, (from + to) / 2); return { ...x, from, to, mid, r: ((to - from) / 2) * 1000 + 3000 }; }), [f, start]);

  const drift = downstream(start, Math.min(hours * f * 0.55, 160));
  const trail: [number, number][] = [];
  for (let k = 0; k <= 10; k++) trail.push(downstream(start, (Math.min(hours * f * 0.55, 160) * k) / 10));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Flood Search Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">Support search teams with flood-aware downstream modelling.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-medium/50 bg-medium/10 px-3 py-2 text-xs font-semibold text-medium"><AlertTriangle className="h-4 w-4" />Illustrative model • Not a person-location prediction</div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr_300px]">
        <Panel title="Search Scenario">
          <div className="space-y-3">
            <div><Label>Last known location</Label><select className={field} value={place} onChange={(e) => { setPlace(e.target.value); setGenerated(false); }}>{Object.keys(PLACES).map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><Label>Time last seen</Label><input type="datetime-local" className={field} value={seen} onChange={(e) => { setSeen(e.target.value); setGenerated(false); }} /></div>
            <div><Label>Flood extent layer</Label><select className={field} value={extent} onChange={(e) => setExtent(e.target.value)}><option>Sentinel-1 (18 Jun, 05:45)</option><option>Sentinel-2 (17 Jun, 10:20)</option><option>Field survey (17 Jun)</option></select></div>
            <div><Label>Flow data freshness</Label><select className={field} value={fresh} onChange={(e) => setFresh(e.target.value)}><option>Updated 2 hrs ago</option><option>Updated 6 hrs ago</option><option>Updated 24 hrs ago</option></select></div>
            <Button className="w-full" onClick={() => { setGenerated(true); setHours(0); toast.success("Search scenario generated (simulated)"); }}>Generate search scenario</Button>
          </div>
          <div className="mt-5 rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <div className="mb-2 font-semibold text-foreground">Scenario assumptions</div>
            <ul className="list-disc space-y-1 pl-4">
              <li>Uses flood extent and river flow data.</li>
              <li>Assumes unobstructed downstream movement.</li>
              <li>Does not account for debris, vegetation, or human intervention.</li>
              <li>For decision support only.</li>
            </ul>
          </div>
        </Panel>

        <div className="panel relative h-[600px] p-0">
          <GeoMap center={[26.75, 93.9]} zoom={8}
            lines={[{ points: RIVER, color: "--info", weight: 22, opacity: 0.35 }, { points: RIVER, color: "--primary", weight: 3 }, ...(generated ? [{ points: trail, color: "--high", weight: 3, dashed: true }] : [])]}
            circles={generated ? sectors.map((x) => ({ lat: x.mid[0], lng: x.mid[1], radius: x.r, color: `--${x.tone}`, opacity: 0.18, dashed: true })) : []}
            pins={[
              ...TOWNS.filter(([n]) => ["Jorhat", "Golaghat", "Tezpur", "Dibrugarh", "Sibsagar", "Lakhimpur"].includes(n)).map(([n, lat, lng]) => ({ id: n, lat, lng, kind: "town" as const, label: n })),
              { id: "ls", lat: start[0], lng: start[1], kind: "lastseen", text: "", label: "Last reported location", pulse: true },
              ...(generated ? sectors.map((x) => ({ id: x.k, lat: x.mid[0], lng: x.mid[1], kind: "sector" as const, text: x.k, tip: `Sector ${x.k} · ${x.from}–${x.to} km` })) : []),
              ...(generated && hours > 0 ? [{ id: "drift", lat: drift[0], lng: drift[1], kind: "task" as const, tip: `Modelled drift at +${hours}h` }] : []),
            ]} />
          <MapLegend className="bottom-3 left-3" items={[{ label: "Last reported location", swatch: "--critical" }, { label: "Modeled search sector", swatch: "--primary" }, { label: "Simulated drift path", swatch: "--high", shape: "line" }, { label: "Flood extent", swatch: "--info", shape: "line" }]} />
        </div>

        <Panel title="Search sectors" action={<SimLabel />}>
          {!generated ? <p className="text-sm text-muted-foreground">Generate a scenario to see sectors.</p> : (
            <div className="space-y-3">
              {sectors.map((x) => (
                <div key={x.k} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center justify-between"><span className="font-semibold">Sector {x.k}</span><Tag tone={x.tone}>{x.likely}</Tag></div>
                  <div className="mt-1 text-sm text-primary">{x.from}–{x.to} km downstream</div>
                  <div className="mt-1 text-xs text-muted-foreground">{x.area}</div>
                </div>
              ))}
              <div className="rounded-lg border border-critical/40 bg-critical/10 p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-critical"><AlertTriangle className="h-4 w-4" />Uncertainty: High</div>
                <p className="mt-1 text-muted-foreground">Model uses limited data. Prioritise ground intelligence, local knowledge and on-site verification.</p>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="shrink-0">
            <div className="font-semibold">Simulate downstream movement</div>
            <div className="text-xs text-muted-foreground">Elapsed: <span className="text-primary">+{hours}h</span> from {new Date(seen).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="icon" onClick={() => { if (hours >= 72) setHours(0); setPlay(!play); }} disabled={!generated} aria-label={play ? "Pause" : "Play"}>{play ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" onClick={() => { setPlay(false); setHours(0); }} aria-label="Reset"><RotateCcw className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1">
            <input type="range" min={0} max={72} step={1} value={hours} disabled={!generated} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
            <div className="flex justify-between text-[11px] text-muted-foreground">{[0, 6, 12, 24, 36, 48, 72].map((h) => <span key={h}>{h}h</span>)}</div>
          </div>
          <div className="shrink-0">
            <Label>Flow condition</Label>
            <div className="flex gap-1">{(Object.keys(FLOW) as (keyof typeof FLOW)[]).map((k) => <button key={k} onClick={() => setFlow(k)} className={cn("rounded-md border px-3 py-1.5 text-xs font-semibold", flow === k ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>{k}</button>)}</div>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" />Simulation only. Sector ranges scale with selected flow condition ({f} km/h assumed surface velocity).</p>
      </Panel>
    </div>
  );
}
