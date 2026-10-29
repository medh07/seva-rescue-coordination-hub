import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Ambulance, Accessibility, Droplets, HeartPulse, MapPin, Minus, Plus, Route as RouteIcon, Search, Stethoscope, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { GeoMap, MapLegend } from "@/components/GeoMap";
import { Button, Panel, Tag, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import { MEDICAL, RIVER, TOWNS } from "@/lib/data";
import { occupancy } from "@/lib/logic";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import school from "@/assets/shelter-school.jpg";

export const Route = createFileRoute("/shelters")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }) as { id?: string },
  head: () => meta("Shelters & Medical Aid", "Find open relief shelters, capacity, facilities and nearby medical care across flood-affected districts."),
  component: Shelters,
});

function Shelters() {
  const s = useStore();
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/shelters" });
  const [f, setF] = useState({ open: false, medical: false, accessible: false });
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("All Districts");
  const [route, setRoute] = useState<string | null>(null);
  const sel = s.shelters.find((x) => x.id === id) ?? s.shelters[0];
  const pick = (sid: string) => { nav({ search: { id: sid } }); setRoute(null); };
  const list = useMemo(() => s.shelters.filter((x) => (!f.open || x.open) && (!f.medical || x.medical) && (!f.accessible || x.accessible) && (district === "All Districts" || x.district === district) && `${x.name} ${x.district}`.toLowerCase().includes(q.toLowerCase())), [s.shelters, f, q, district]);
  const occ = occupancy(sel);
  const routeFrom = TOWNS.find(([n]) => n === "Guwahati")!;
  const isStaff = s.role !== "Citizen";
  const plan = (sid: string) => { pick(sid); setRoute(sid); toast.success("Route planned (simulated — avoids flooded roads)"); };
  const rs = s.shelters.find((x) => x.id === route);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Shelters & Medical Aid</h1>
        <p className="mt-1 text-sm text-muted-foreground">Safe spaces and care when it matters most.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="panel relative h-[500px] p-0">
          <GeoMap center={[26.4, 92.3]} zoom={7} fitTo={[sel.lat, sel.lng]}
            lines={[{ points: RIVER, color: "--info", weight: 4, opacity: 0.7 }, ...(rs ? [{ points: [[routeFrom[1], routeFrom[2]], [26.3, 92.1], [rs.lat, rs.lng]] as [number, number][], color: "--primary", weight: 4, dashed: true }] : [])]}
            pins={[
              ...TOWNS.map(([n, lat, lng]) => ({ id: n, lat, lng, kind: "town" as const, label: n })),
              ...s.shelters.map((x) => ({ id: x.id, lat: x.lat, lng: x.lng, kind: "shelter" as const, text: "⌂", selected: x.id === sel.id, tip: `${x.name} · ${x.capacity - x.occupied} spaces`, onClick: () => pick(x.id) })),
              ...MEDICAL.map((m) => ({ id: m.id, lat: m.lat, lng: m.lng, kind: "medical" as const, text: "+", tip: `${m.name} (${m.kind})` })),
            ]} />
          <MapLegend className="bottom-3 left-3" items={[{ label: "Shelter", swatch: "--success", shape: "square" }, { label: "Hospital / Medical", swatch: "--critical" }, { label: "Major town", swatch: "--foreground" }, { label: "Rivers", swatch: "--info", shape: "line" }]} />
        </div>

        <Panel className="p-0">
          <img src={school} alt={sel.name} width={1088} height={608} className="h-40 w-full rounded-t-xl object-cover" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="text-lg font-bold">{sel.name}</h3><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{sel.district}, Assam · {sel.type}</div></div>
              <Tag tone={sel.open ? "low" : "critical"}>{sel.open ? "Open" : "Full"}</Tag>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm"><span>{occ}% occupied</span><span className="text-muted-foreground">{sel.occupied}/{sel.capacity}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary"><div className={cn("h-full rounded-full", occ > 90 ? "bg-critical" : occ > 70 ? "bg-high" : "bg-success")} style={{ width: `${occ}%` }} /></div>
              <div className="mt-1 text-xs text-success">{sel.capacity - sel.occupied} spaces available</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className={cn("rounded-lg p-2", sel.water ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground line-through")}><Droplets className="mx-auto mb-1 h-4 w-4" />Drinking water</div>
              <div className={cn("rounded-lg p-2", sel.medical ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground line-through")}><Stethoscope className="mx-auto mb-1 h-4 w-4" />Medical desk</div>
              <div className={cn("rounded-lg p-2", sel.accessible ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground line-through")}><Accessibility className="mx-auto mb-1 h-4 w-4" />Accessible</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => plan(sel.id)}><RouteIcon className="h-4 w-4" />Plan route</Button>
              <Button onClick={() => isStaff ? nav({ to: "/resources", search: { dest: `${sel.name}, ${sel.district}` } }) : toast.info("Supply requests are handled by shelter staff")}>Request supplies</Button>
            </div>
            {isStaff && (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-2 text-xs">
                <span className="text-muted-foreground">Update headcount</span>
                <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => s.updateShelter(sel.id, -10)} aria-label="Minus 10"><Minus className="h-3 w-3" />10</Button><Button size="sm" variant="ghost" onClick={() => s.updateShelter(sel.id, 10)} aria-label="Plus 10"><Plus className="h-3 w-3" />10</Button></div>
              </div>
            )}
            <div className="mt-2 text-[11px] text-muted-foreground">Last update: {sel.updated}</div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel flex items-center gap-3 p-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-success/10 text-success"><HeartPulse className="h-5 w-5" /></div><div className="flex-1"><div className="flex items-center gap-2 font-semibold">Field Health Camp <Tag tone="low">Active</Tag></div><div className="text-xs text-muted-foreground">Barpeta · 9 AM – 6 PM · 3 doctors</div></div></div>
        <div className="panel flex items-center gap-3 p-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-critical/10 text-critical"><Ambulance className="h-5 w-5" /></div><div><div className="font-display text-2xl font-bold">{s.teams.filter((t) => t.type === "Medical" && t.status === "Available").length}</div><div className="text-xs text-muted-foreground">Ambulances / medical teams available</div></div></div>
        <div className="panel flex items-center gap-3 p-4"><div className="grid h-11 w-11 place-items-center rounded-full bg-info/10 text-info"><Users className="h-5 w-5" /></div><div><div className="font-display text-2xl font-bold">{s.incidents.filter((i) => i.status === "Medical handover").length + 13}</div><div className="text-xs text-muted-foreground">Patient handovers today</div></div></div>
      </div>

      <Panel title="Shelter Directory">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {([["open", "Open shelters"], ["medical", "Medical care"], ["accessible", "Accessible"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setF({ ...f, [k]: !f[k] })} className={cn("rounded-lg border px-3 py-1.5 text-xs font-semibold", f[k] ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>{l}</button>
            ))}
          </div>
          <div className="relative md:ml-auto md:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className={cn(field, "pl-9")} placeholder="Search shelters..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <select className={cn(field, "md:w-44")} value={district} onChange={(e) => setDistrict(e.target.value)}><option>All Districts</option>{[...new Set(s.shelters.map((x) => x.district))].map((d) => <option key={d}>{d}</option>)}</select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr>{["Shelter Name", "Location", "Type", "Capacity", "Occupied", "Available", "Facilities", "Last Update", "Actions"].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">No shelters match these filters.</td></tr>}
              {list.map((x) => (
                <tr key={x.id} onClick={() => pick(x.id)} className={cn("cursor-pointer border-t border-border hover:bg-secondary/40", x.id === sel.id && "bg-primary/5")}>
                  <td className="py-2.5 pr-3 font-semibold">{x.name}</td><td className="pr-3">{x.district}</td><td className="pr-3">{x.type}</td><td className="pr-3">{x.capacity}</td><td className="pr-3">{x.occupied}</td>
                  <td className={cn("pr-3 font-semibold", x.capacity - x.occupied === 0 ? "text-critical" : "text-success")}>{x.capacity - x.occupied}</td>
                  <td className="pr-3"><div className="flex gap-1.5 text-primary">{x.water && <Droplets className="h-4 w-4" />}{x.medical && <Stethoscope className="h-4 w-4" />}{x.accessible && <Accessibility className="h-4 w-4" />}</div></td>
                  <td className="pr-3 text-xs text-muted-foreground">{x.updated}</td>
                  <td><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); plan(x.id); }}>Plan route</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
