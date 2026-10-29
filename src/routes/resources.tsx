import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Package, PackagePlus, Truck, Warehouse } from "lucide-react";
import { useState } from "react";
import { Button, Label, Panel, PageHeader, Stat, Tag, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import { minsAgo } from "@/lib/logic";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resources")({
  validateSearch: (s: Record<string, unknown>) => ({ dest: typeof s.dest === "string" ? s.dest : undefined }) as { dest?: string },
  head: () => meta("Resources & Dispatch", "Track relief stock levels and dispatch food, water, medical kits and rescue equipment to shelters and teams."),
  component: Resources,
});

function Resources() {
  const s = useStore();
  const { dest } = Route.useSearch();
  const [form, setForm] = useState({ rid: "R1", qty: 100, dest: dest ?? "", vehicle: "" });
  const [cat, setCat] = useState("All");
  const [restock, setRestock] = useState<string | null>(null);
  const destinations = [...s.shelters.map((x) => `${x.name}, ${x.district}`), ...s.teams.map((t) => `${t.name}, ${t.district}`)];
  const r = s.resources.find((x) => x.id === form.rid)!;
  const low = s.resources.filter((x) => x.stock < x.min);
  const canDispatch = s.role !== "Citizen";

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Logistics" title="Resources & Dispatch" desc="Monitor warehouse stock and send supplies where they are needed." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Warehouse className="h-5 w-5" />} value={s.resources.length} label="Item types" sub="Guwahati central store" />
        <Stat tone="info" icon={<Truck className="h-5 w-5" />} value={s.dispatches.filter((d) => d.status === "In transit").length} label="In transit" sub="Vehicles moving" />
        <Stat tone="success" icon={<CheckCircle2 className="h-5 w-5" />} value={s.dispatches.filter((d) => d.status === "Delivered").length} label="Delivered" sub="Today" />
        <Stat tone="critical" icon={<AlertTriangle className="h-5 w-5" />} value={low.length} label="Low stock" sub="Below minimum" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Inventory" action={<select value={cat} onChange={(e) => setCat(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs">{["All", ...new Set(s.resources.map((x) => x.category))].map((c) => <option key={c}>{c}</option>)}</select>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.resources.filter((x) => cat === "All" || x.category === cat).map((x) => {
              const pct = Math.min(100, Math.round((x.stock / (x.min * 4)) * 100));
              const isLow = x.stock < x.min;
              return (
                <div key={x.id} className={cn("rounded-lg border bg-background/40 p-3", isLow ? "border-critical/50" : "border-border")}>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-primary" />{x.name}</div>{isLow ? <Tag tone="critical">Low</Tag> : <Tag>{x.category}</Tag>}</div>
                  <div className="mt-2 font-display text-xl font-bold">{x.stock.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">{x.unit}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={cn("h-full", isLow ? "bg-critical" : "bg-primary")} style={{ width: `${pct}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Min {x.min.toLocaleString("en-IN")}</span>
                    {canDispatch && (restock === x.id ? (
                      <span className="flex gap-1">{[50, 500].map((n) => <button key={n} className="rounded bg-secondary px-2 py-0.5 text-foreground hover:text-primary" onClick={() => { s.restock(x.id, n); setRestock(null); }}>+{n}</button>)}</span>
                    ) : <button className="flex items-center gap-1 text-primary" onClick={() => setRestock(x.id)}><PackagePlus className="h-3 w-3" />Restock</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="New dispatch" className="h-fit">
          {!canDispatch ? <p className="text-sm text-muted-foreground">Dispatch is available to response staff and NGO partners.</p> : (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); s.dispatch(form.rid, form.qty, form.dest, form.vehicle); }}>
              <div><Label>Item</Label><select className={field} value={form.rid} onChange={(e) => setForm({ ...form, rid: e.target.value })}>{s.resources.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.stock} {x.unit})</option>)}</select></div>
              <div><Label>Quantity ({r.unit})</Label><input type="number" min={1} className={field} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></div>
              <div><Label>Destination</Label><input list="dests" className={field} value={form.dest} onChange={(e) => setForm({ ...form, dest: e.target.value })} placeholder="Shelter, team or grid" /><datalist id="dests">{destinations.map((d) => <option key={d} value={d} />)}</datalist></div>
              <div><Label>Vehicle (optional)</Label><input className={field} value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="e.g. Truck AS-01-1234" /></div>
              <Button type="submit" className="w-full"><Truck className="h-4 w-4" />Create dispatch</Button>
            </form>
          )}
        </Panel>
      </div>

      <Panel title="Dispatch tracker">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr>{["ID", "Item", "Qty", "Destination", "Vehicle", "Created", "Status", ""].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{s.dispatches.map((d) => { const it = s.resources.find((x) => x.id === d.resourceId); return (
              <tr key={d.id} className="border-t border-border">
                <td className="py-2.5 pr-3 font-semibold">{d.id}</td><td className="pr-3">{it?.name}</td><td className="pr-3">{d.qty.toLocaleString("en-IN")}</td><td className="pr-3">{d.destination}</td><td className="pr-3 text-muted-foreground">{d.vehicle}</td><td className="pr-3 text-muted-foreground">{minsAgo(d.createdAt)}</td>
                <td className="pr-3"><Tag tone={d.status === "Delivered" ? "low" : d.status === "In transit" ? "info" : "medium"}>{d.status}</Tag></td>
                <td>{d.status !== "Delivered" && canDispatch && <Button size="sm" variant="outline" onClick={() => s.advanceDispatch(d.id)}>{d.status === "Packed" ? "Mark sent" : "Mark delivered"}</Button>}</td>
              </tr>
            ); })}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
