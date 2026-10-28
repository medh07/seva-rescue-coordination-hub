import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Info, Siren, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { GeoMap, MapLegend, type Rect } from "@/components/GeoMap";
import { Button, Panel, Segmented, SimLabel, Tag, toneOf } from "@/components/seva";
import { useStore } from "@/lib/store";
import { GRID_BOUNDS, TOWNS, RIVER, type Cell } from "@/lib/data";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/risk-grid")({
  validateSearch: (s: Record<string, unknown>) => ({ cell: typeof s.cell === "string" ? s.cell : undefined }),
  head: () => meta("Population & Risk Grid", "Grid-based estimates of exposed population, flood depth, damage and access to prioritise response."),
  component: RiskGrid,
});

type LayerK = "population" | "depth" | "damage" | "access";
const ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, None: 4 };
const rowH = (GRID_BOUNDS.north - GRID_BOUNDS.south) / 6, colW = (GRID_BOUNDS.east - GRID_BOUNDS.west) / 8;

function colorFor(c: Cell, layer: LayerK): [string, number] {
  if (layer === "population") return c.population > 500 ? ["--critical", 0.5] : c.population > 300 ? ["--high", 0.45] : c.population > 150 ? ["--medium", 0.4] : c.population > 0 ? ["--low", 0.25] : ["--muted", 0.08];
  if (layer === "damage") return c.damage > 10 ? ["--critical", 0.5] : c.damage > 4 ? ["--high", 0.45] : c.damage > 0 ? ["--medium", 0.4] : ["--muted", 0.08];
  if (layer === "access") return c.access === "Blocked" ? ["--critical", 0.5] : c.access === "Limited" ? ["--high", 0.4] : ["--low", 0.15];
  return c.risk === "None" ? ["--muted", 0.08] : [`--${c.risk.toLowerCase()}`, c.risk === "Low" ? 0.25 : 0.45];
}

function RiskGrid() {
  const s = useStore();
  const { cell } = Route.useSearch();
  const nav = useNavigate({ from: "/risk-grid" });
  const [layer, setLayer] = useState<LayerK>("depth");
  const [filter, setFilter] = useState("All");
  const sel = s.cells.find((c) => c.id === (cell ?? "B4"))!;
  const pick = (id: string) => nav({ search: { cell: id } });

  const rects: Rect[] = s.cells.map((c) => {
    const n = GRID_BOUNDS.north - c.row * rowH, w = GRID_BOUNDS.west + c.col * colW;
    const [color, opacity] = colorFor(c, layer);
    return { id: c.id, bounds: [[n, w], [n - rowH, w + colW]], color, opacity, label: c.id, selected: c.id === sel.id, onClick: () => pick(c.id) };
  });
  const rows = useMemo(() => s.cells.filter((c) => c.risk !== "None" && (filter === "All" || c.risk === filter)).sort((a, b) => ORDER[a.risk] - ORDER[b.risk] || b.population - a.population), [s.cells, filter]);
  const sosHere = s.incidents.filter((i) => i.grid === sel.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Population & Risk Grid</h1>
          <p className="mt-1 text-sm text-muted-foreground">Grid-based risk assessment to support prioritisation and response planning. <SimLabel>Modelled estimates</SimLabel></p>
        </div>
        <Segmented value={layer} onChange={setLayer} options={[{ value: "population", label: "Estimated population" }, { value: "depth", label: "Flood depth" }, { value: "damage", label: "Damage reports" }, { value: "access", label: "Access" }]} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="panel relative h-[560px] p-0">
          <GeoMap center={[26.47, 92.7]} zoom={9} rects={rects} lines={[{ points: RIVER, color: "--info", weight: 6, opacity: 0.7 }]} pins={TOWNS.map(([n, lat, lng]) => ({ id: n, lat, lng, kind: "town" as const, label: n }))} />
          <MapLegend className="bottom-3 left-3" title="Risk level" items={[{ label: "Critical", swatch: "--critical", shape: "square" }, { label: "High", swatch: "--high", shape: "square" }, { label: "Medium", swatch: "--medium", shape: "square" }, { label: "Low", swatch: "--low", shape: "square" }, { label: "No data", swatch: "--muted", shape: "square" }]} />
        </div>

        <Panel>
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Grid Cell {sel.id}</h3><Tag tone={sel.risk === "None" ? "muted" : toneOf(sel.risk)}>{sel.risk === "None" ? "No data" : `${sel.risk} risk`}</Tag></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3"><Users className="h-4 w-4 text-primary" /><div className="mt-1 font-display text-2xl font-bold">{sel.population}</div><div className="text-xs text-muted-foreground">Estimated exposed</div></div>
            <div className="rounded-lg bg-secondary/50 p-3"><Siren className="h-4 w-4 text-critical" /><div className="mt-1 font-display text-2xl font-bold">{sel.sos + sosHere.filter((i) => i.source === "citizen").length}</div><div className="text-xs text-muted-foreground">SOS reports</div></div>
          </div>
          <div className="mt-4 text-sm font-semibold">Priority factors</div>
          <ul className="mt-2 space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-muted-foreground">Flood depth</span><span>{sel.depth}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Damage reports</span><span>{sel.damage}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Access</span><span className={cn(sel.access === "Blocked" && "text-critical", sel.access === "Limited" && "text-high")}>{sel.access}</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">Key issue</span><span className="text-right">{sel.issue}</span></li>
          </ul>
          <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between text-sm"><span>Confidence level</span><Tag tone={sel.confidence === "High" ? "low" : sel.confidence === "Moderate" ? "medium" : "critical"}>{sel.confidence}</Tag></div>
            <p className="mt-2 flex gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0" />Based on {sel.source.toLowerCase()}. Population figures are modelled estimates, not a census.</p>
          </div>
          {sel.risk === "Critical" && <div className="mt-3 flex gap-2 rounded-lg border border-high/40 bg-high/10 p-3 text-xs text-high"><AlertTriangle className="h-4 w-4 shrink-0" />No recent ground assessment in last 6 hours.</div>}
          {sosHere.length > 0 && <div className="mt-3 text-xs text-muted-foreground">Open incidents: {sosHere.map((i) => i.id).join(", ")}</div>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => nav({ to: "/rescue" })}>View incidents</Button>
            <Button size="sm" onClick={() => nav({ to: "/resources", search: { dest: `Grid ${sel.id}` } })}>Send supplies</Button>
          </div>
        </Panel>
      </div>

      <Panel title="Priority Areas" action={<select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs">{["All", "Critical", "High", "Medium", "Low"].map((x) => <option key={x}>{x}</option>)}</select>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr>{["Grid Cell", "Risk Level", "Population", "SOS Reports", "Key Issues", "Last Updated", "Source"].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} onClick={() => pick(c.id)} className={cn("cursor-pointer border-t border-border hover:bg-secondary/40", c.id === sel.id && "bg-primary/5")}>
                <td className="py-2.5 pr-3 font-semibold">{c.id}</td><td className="pr-3"><Tag tone={toneOf(c.risk)}>{c.risk}</Tag></td><td className="pr-3">{c.population}</td><td className="pr-3">{c.sos}</td><td className="pr-3">{c.issue}</td><td className="pr-3 text-muted-foreground">{c.updated}</td><td className="text-muted-foreground">{c.source}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
