import { createFileRoute } from "@tanstack/react-router";
import { Check, Crosshair, MapPin, Siren, WifiOff } from "lucide-react";
import { useState } from "react";
import { GeoMap } from "@/components/GeoMap";
import { Button, Label, Panel, Tag, Toggle, field, PriorityTag } from "@/components/seva";
import { nextSosId, useStore } from "@/lib/store";
import { DISTRICTS, STEPS } from "@/lib/data";
import { clock } from "@/lib/logic";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/sos")({
  head: () => meta("Citizen SOS", "Send an emergency SOS with your location and track help as it arrives — works offline via simulated SMS."),
  component: SOS,
});

const NEEDS = ["Boat", "Medical", "Food", "Water", "Shelter"];

function SOS() {
  const s = useStore();
  const [form, setForm] = useState({ name: "", phone: "", people: 1, needs: [] as string[], details: "", district: "Nagaon" });
  const [pos, setPos] = useState<[number, number]>([26.35, 92.68]);
  const [track, setTrack] = useState("");
  const [mine, setMine] = useState<string | null>(null);
  const tracked = [...s.incidents, ...s.offlineQueue].find((i) => i.id.toLowerCase() === (track || mine || "").toLowerCase());

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location not available");
    navigator.geolocation.getCurrentPosition((p) => { setPos([p.coords.latitude, p.coords.longitude]); toast.success("Location captured"); }, () => toast.error("Couldn't get location — tap the map instead"));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\+?\d[\d\s-]{8,}$/.test(form.phone)) return toast.error("Enter a valid phone number");
    if (form.people < 1) return toast.error("At least 1 person");
    const id = nextSosId(s);
    s.submitSOS({ ...form, id, lat: pos[0], lng: pos[1] });
    setMine(id); setTrack("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-critical/15 text-critical"><Siren className="h-6 w-6" /></div>
        <div className="min-w-0"><h1 className="text-2xl font-bold md:text-3xl">Citizen SOS</h1><p className="text-sm text-muted-foreground">Need rescue? Send your location. Help will be coordinated.</p></div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex min-w-0 items-center gap-2 text-sm"><WifiOff className={cn("h-4 w-4 shrink-0", s.settings.offline ? "text-high" : "text-muted-foreground")} /><span className="truncate">Offline mode <Tag tone="medium">Simulated</Tag></span></div>
        <Toggle on={s.settings.offline} onChange={(v) => s.setSettings({ offline: v })} label="Offline mode" />
      </div>
      {s.offlineQueue.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-high/40 bg-high/10 p-3 text-sm">
          <span>{s.offlineQueue.length} SOS queued for SMS fallback.</span>
          <Button size="sm" variant="outline" disabled={s.settings.offline} onClick={s.syncOffline}>Sync now</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel>
          <form className="space-y-3" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Your name</Label><input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Optional" /></div>
              <div><Label>Phone *</Label><input className={field} inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98xxxxxxx" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>People with you</Label><input type="number" min={1} className={field} value={form.people} onChange={(e) => setForm({ ...form, people: Number(e.target.value) })} /></div>
              <div><Label>District</Label><select className={field} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
            </div>
            <div><Label>What do you need?</Label>
              <div className="flex flex-wrap gap-2">{NEEDS.map((n) => { const on = form.needs.includes(n); return <button type="button" key={n} onClick={() => setForm({ ...form, needs: on ? form.needs.filter((x) => x !== n) : [...form.needs, n] })} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground")}>{n}</button>; })}</div>
            </div>
            <div><Label>Details</Label><textarea className={cn(field, "h-20 py-2")} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="e.g. on rooftop, water rising, elderly person" /></div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{pos[0].toFixed(3)}, {pos[1].toFixed(3)}</span><Button type="button" size="sm" variant="ghost" onClick={locate}><Crosshair className="h-3.5 w-3.5" />Use my location</Button></div>
            <Button type="submit" variant="danger" size="lg" className="h-14 w-full text-lg"><Siren className="h-5 w-5" />{s.settings.offline ? "Queue SOS (offline)" : "Send SOS"}</Button>
          </form>
        </Panel>
        <div className="space-y-5">
          <div className="panel h-[260px] p-0"><GeoMap center={pos} zoom={9} fitTo={pos} onMapClick={(a, b) => setPos([a, b])} pins={[{ id: "me", lat: pos[0], lng: pos[1], kind: "sos", text: "SOS", pulse: true, label: "Your location" }]} /></div>
          <Panel title="Track your SOS">
            <input className={field} value={track || mine || ""} onChange={(e) => setTrack(e.target.value)} placeholder="Enter SOS ID e.g. SOS-024" />
            {tracked ? (
              <div className="mt-3">
                <div className="flex items-center justify-between"><span className="font-semibold">{tracked.id}</span><PriorityTag p={tracked.priority} /></div>
                {tracked.offline && <p className="mt-1 text-xs text-high">Queued offline — will send when connection returns (simulated).</p>}
                <ol className="mt-3 space-y-2">{STEPS.map((st, k) => { const h = tracked.history.find((x) => x.step === st); const done = k <= STEPS.indexOf(tracked.status); return (
                  <li key={st} className="flex items-center gap-3 text-sm"><span className={cn("grid h-6 w-6 place-items-center rounded-full border", done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{done ? <Check className="h-3 w-3" /> : k + 1}</span><span className={cn(!done && "text-muted-foreground")}>{st}</span><span className="ml-auto text-xs text-muted-foreground">{h ? clock(h.at) : ""}</span></li>
                ); })}</ol>
              </div>
            ) : (track && <p className="mt-2 text-xs text-muted-foreground">No SOS found with that ID.</p>)}
          </Panel>
        </div>
      </div>
    </div>
  );
}
