import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Box, ClipboardList, Cross, HandHeart, Home, Leaf, MapPin, Plus, Users, Utensils, Waves } from "lucide-react";
import { useState } from "react";
import { GeoMap } from "@/components/GeoMap";
import { Button, Label, Panel, Segmented, Stat, Tag, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/data";
import { DISTRICTS } from "@/lib/data";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/ngos")({
  head: () => meta("NGO & Volunteer Coordination", "Coordinate verified NGOs and volunteers, assign relief tasks and onboard new organisations."),
  component: Ngos,
});

const LOGO = { leaf: Leaf, wave: Waves, cross: Cross };
const TICON = { meal: Utensils, home: Home, box: Box, plus: Plus };
const COLS: TaskStatus[] = ["Available", "Assigned", "In progress"];
const FOCUS = ["Food Distribution", "Medical Aid", "Shelter Support", "Rescue Support", "Logistics", "Child Care"];

function TaskCard({ t }: { t: Task }) {
  const s = useStore();
  const I = TICON[t.icon];
  const next = t.status === "Available" ? "Assigned" : t.status === "Assigned" ? "In progress" : null;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><I className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="text-[11px] text-muted-foreground">{t.location} · {t.ago}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Tag tone="primary">{t.tag}</Tag>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" />{t.volunteers}</span>
      </div>
      {next ? <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => s.setTaskStatus(t.id, next)}>{next === "Assigned" ? "Accept task" : "Start task"}</Button>
        : <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => { s.setTaskStatus(t.id, "Available"); toast.success(`${t.title} marked complete`); }}>Mark complete</Button>}
    </div>
  );
}

function Ngos() {
  const s = useStore();
  const [kind, setKind] = useState<"Organisation" | "Volunteer">("Organisation");
  const [form, setForm] = useState({ name: "", type: "NGO", reg: "", areas: "", focus: [] as string[] });
  const [showTask, setShowTask] = useState(false);
  const [task, setTask] = useState({ title: "", district: "Nagaon", tag: "Food Distribution", volunteers: 5 });
  const vols = s.orgs.reduce((a, o) => a + o.volunteers, 0);
  const open = s.tasks.filter((t) => t.status === "Available").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return toast.error("Enter a name (3+ characters)");
    if (kind === "Organisation" && !form.reg.trim()) return toast.error("Registration number is required");
    if (!form.focus.length) return toast.error("Select at least one focus area");
    s.apply(kind, form.name);
    setForm({ name: "", type: "NGO", reg: "", areas: "", focus: [] });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">People ready to help.</div>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">NGO & Volunteer Coordination</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connect verified organisations and volunteers to where they are needed most.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<HandHeart className="h-5 w-5" />} value={s.orgs.length + 13} label="Organisations" sub="Verified" />
          <Stat tone="success" icon={<Users className="h-5 w-5" />} value={vols} label="Volunteers" sub="Registered" />
          <Stat tone="high" icon={<ClipboardList className="h-5 w-5" />} value={open} label="Open tasks" sub="Need help" />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Panel title="Featured Organisations">
            <div className="grid gap-3 md:grid-cols-3">
              {s.orgs.slice(0, 3).map((o) => { const I = LOGO[o.logo]; return (
                <div key={o.id} className="flex flex-col rounded-xl border border-border bg-background/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><I className="h-5 w-5" /></div>
                    <div className="min-w-0"><div className="font-semibold leading-tight">{o.name}</div><div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{o.location}</div></div>
                  </div>
                  <Tag tone="low" className="mt-3 w-fit"><BadgeCheck className="h-3 w-3" />Verified</Tag>
                  <p className="mt-2 flex-1 text-xs text-muted-foreground">{o.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1">{o.tags.map((t) => <span key={t} className="rounded bg-secondary px-2 py-0.5 text-[10px]">{t}</span>)}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">{Array.from({ length: 3 }).map((_, k) => <div key={k} className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-accent text-[9px] font-bold">{"ARS"[k]}</div>)}<div className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-secondary text-[9px]">+{o.volunteers}</div></div>
                    <Button size="sm" variant={o.requested ? "ghost" : "outline"} disabled={o.requested} onClick={() => s.requestOrg(o.id)}>{o.requested ? "Requested" : "Request support"}</Button>
                  </div>
                </div>
              ); })}
            </div>
          </Panel>

          <Panel title="Relief Task Board" action={s.role !== "Citizen" && <Button size="sm" variant="outline" onClick={() => setShowTask(!showTask)}><Plus className="h-3.5 w-3.5" />Post task</Button>}>
            {showTask && (
              <form className="mb-4 grid gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 md:grid-cols-[1fr_140px_160px_90px_auto]" onSubmit={(e) => { e.preventDefault(); if (!task.title.trim()) return toast.error("Task title required"); s.addTask({ title: task.title, location: `${task.district}, Assam`, tag: task.tag, volunteers: task.volunteers, icon: "box", lat: 26.3, lng: 92.3 }); setTask({ ...task, title: "" }); setShowTask(false); }}>
                <input className={field} placeholder="Task title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} />
                <select className={field} value={task.district} onChange={(e) => setTask({ ...task, district: e.target.value })}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>
                <select className={field} value={task.tag} onChange={(e) => setTask({ ...task, tag: e.target.value })}>{FOCUS.map((d) => <option key={d}>{d}</option>)}</select>
                <input className={field} type="number" min={1} value={task.volunteers} onChange={(e) => setTask({ ...task, volunteers: Number(e.target.value) })} aria-label="Volunteers needed" />
                <Button type="submit">Post</Button>
              </form>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {COLS.map((c) => { const items = s.tasks.filter((t) => t.status === c); return (
                <div key={c}>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className={cn("h-2 w-2 rounded-full", c === "Available" ? "bg-success" : c === "Assigned" ? "bg-info" : "bg-high")} />{c}<span className="rounded bg-secondary px-1.5 text-xs">{items.length}</span></div>
                  <div className="space-y-2">{items.map((t) => <TaskCard key={t.id} t={t} />)}</div>
                </div>
              ); })}
            </div>
          </Panel>

          <Panel title="Organisation Locations">
            <div className="h-[320px]"><GeoMap center={[26.6, 92.5]} zoom={7} pins={[...s.orgs.map((o) => ({ id: o.id, lat: o.lat, lng: o.lng, kind: "ngo" as const, tip: `${o.name} · ${o.volunteers} volunteers` })), ...s.tasks.filter((t) => t.status !== "In progress").map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, kind: "task" as const, tip: t.title }))]} /></div>
          </Panel>
        </div>

        <Panel title="Join the relief network" className="h-fit xl:sticky xl:top-20">
          <p className="-mt-1 mb-3 text-xs text-muted-foreground">Register your organisation or as a volunteer. All registrations are verified before activation.</p>
          <Segmented value={kind} onChange={setKind} className="mb-4 w-full" options={[{ value: "Organisation", label: "Organisation" }, { value: "Volunteer", label: "Volunteer" }]} />
          <form className="space-y-3" onSubmit={submit}>
            <div><Label>{kind === "Organisation" ? "Organisation name" : "Full name"}</Label><input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={kind === "Organisation" ? "e.g. Hope Relief Trust" : "e.g. Priya Das"} /></div>
            {kind === "Organisation" && (<>
              <div><Label>Organisation type</Label><select className={field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>NGO</option><option>Trust</option><option>Community group</option><option>Religious body</option></select></div>
              <div><Label>Registration number</Label><input className={field} value={form.reg} onChange={(e) => setForm({ ...form, reg: e.target.value })} placeholder="NGO-DARPAN ID" /></div>
            </>)}
            <div><Label>Operating areas</Label><input className={field} value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} placeholder="Districts, comma separated" /></div>
            <div>
              <Label>Key focus areas</Label>
              <div className="grid grid-cols-2 gap-1.5">{FOCUS.map((f) => (
                <label key={f} className="flex cursor-pointer items-center gap-2 text-xs"><input type="checkbox" className="accent-[var(--primary)]" checked={form.focus.includes(f)} onChange={(e) => setForm({ ...form, focus: e.target.checked ? [...form.focus, f] : form.focus.filter((x) => x !== f) })} />{f}</label>
              ))}</div>
            </div>
            <Button type="submit" className="w-full">Request verification</Button>
          </form>
          {s.applications.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-border pt-3">
              <div className="text-xs font-semibold text-muted-foreground">Pending verification</div>
              {s.applications.slice(0, 4).map((a) => <div key={a.id} className="flex justify-between text-xs"><span>{a.name}</span><Tag tone="medium">{a.kind}</Tag></div>)}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
