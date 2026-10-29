import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, List, Map as MapIcon, MapPin, Phone, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { GeoMap, MapLegend, type Pin } from "@/components/GeoMap";
import { Button, Panel, PriorityTag, Segmented, Tag, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import { STEPS, RIVER } from "@/lib/data";
import { clock, minsAgo, sortQueue, tabOf } from "@/lib/logic";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

type Tab = "Active" | "Assigned" | "Completed";
export const Route = createFileRoute("/rescue")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined, tab: (["Active", "Assigned", "Completed"].includes(s.tab as string) ? s.tab : undefined) as Tab | undefined }) as { id?: string; tab?: Tab },
  head: () => meta("Rescue Operations", "Triage SOS incidents, assign rescue teams and track every rescue from report to medical handover."),
  component: Rescue,
});

const CHECK = ["Life jackets (6)", "First aid kit", "Rope & throw bags", "Emergency food packets", "Torch & batteries"];

function Rescue() {
  const s = useStore();
  const { id, tab: tabQ } = Route.useSearch();
  const nav = useNavigate({ from: "/rescue" });
  const [tab, setTab] = useState<Tab>(tabQ ?? (id ? tabOf(s.incidents.find((i) => i.id === id)?.status ?? "Received") as Tab : "Active"));
  const [view, setView] = useState<"map" | "list">("map");
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState(false);

  const list = useMemo(() => sortQueue(s.incidents.filter((i) => tabOf(i.status) === tab && `${i.id} ${i.district} ${i.title}`.toLowerCase().includes(q.toLowerCase()))), [s.incidents, tab, q]);
  const sel = s.incidents.find((i) => i.id === id) ?? list[0];
  const counts = { Active: 0, Assigned: 0, Completed: 0 } as Record<Tab, number>;
  s.incidents.forEach((i) => counts[tabOf(i.status) as Tab]++);
  const avail = s.teams.filter((t) => t.status === "Available");
  const assignedTeam = s.teams.find((t) => t.id === sel?.teamId);
  const select = (iid: string) => { nav({ search: (p) => ({ ...p, id: iid }) }); setTeam(""); setChecks({}); setReview(false); };

  const pins: Pin[] = [
    ...s.incidents.filter((i) => tabOf(i.status) === tab).map((i) => ({ id: i.id, lat: i.lat, lng: i.lng, kind: "sos" as const, text: "SOS", label: i.id, selected: i.id === sel?.id, variant: i.priority === "Medium" ? ("medium" as const) : i.priority === "Low" ? ("low" as const) : undefined, onClick: () => select(i.id) })),
    ...s.teams.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng, kind: "team" as const, text: "⛵", tip: `${t.name} · ${t.status}`, label: t.id === (team || sel?.teamId) ? t.name : undefined })),
  ];
  const routeTeam = s.teams.find((t) => t.id === (team || sel?.teamId));
  const lines = [{ points: RIVER, color: "--primary", weight: 3, opacity: 0.5 }, ...(sel && routeTeam ? [{ points: [[routeTeam.lat, routeTeam.lng], [(routeTeam.lat + sel.lat) / 2 + 0.03, (routeTeam.lng + sel.lng) / 2], [sel.lat, sel.lng]] as [number, number][], color: "--primary", weight: 3, dashed: true }] : [])];
  const stepIdx = sel ? STEPS.indexOf(sel.status) : 0;
  const canAct = s.role !== "NGO Partner" && s.role !== "Citizen";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Rescue Operations</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={tab} onChange={(v) => { setTab(v); nav({ search: { tab: v } }); }} options={(["Active", "Assigned", "Completed"] as Tab[]).map((t) => ({ value: t, label: <>{t} <span className="ml-1 rounded bg-secondary px-1.5">{counts[t]}</span></> }))} />
          <Segmented value={view} onChange={setView} options={[{ value: "map", label: <span className="flex items-center gap-1"><MapIcon className="h-3.5 w-3.5" />Map View</span> }, { value: "list", label: <span className="flex items-center gap-1"><List className="h-3.5 w-3.5" />List View</span> }]} />
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search incidents..." className={cn(field, "w-56 pl-9")} /></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr_360px]">
        <Panel title={`${tab} incidents`} className="max-h-[620px] overflow-y-auto">
          <div className="space-y-2">
            {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No incidents here.</p>}
            {list.map((i) => (
              <button key={i.id} onClick={() => select(i.id)} className={cn("flex w-full gap-3 rounded-lg border p-2 text-left transition-colors", sel?.id === i.id ? "glow-active bg-primary/5" : "border-border hover:border-primary/40")}>
                <img src={i.img} alt="" loading="lazy" width={64} height={64} className="h-16 w-16 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1"><span className="text-sm font-bold">{i.id}</span><PriorityTag p={i.priority} /></div>
                  <div className="truncate text-xs">{i.title}</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />Grid {i.grid}, {i.district}</div>
                  <div className="text-[11px] text-muted-foreground">{minsAgo(i.reportedAt)} {i.offline && "· via SMS"}</div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {view === "map" ? (
          <div className="panel relative h-[620px] p-0">
            <GeoMap center={[26.3, 92.0]} zoom={8} pins={pins} lines={lines} fitTo={sel ? [sel.lat, sel.lng] : null} />
            <MapLegend className="bottom-3 left-3" items={[{ label: "SOS Location", swatch: "--critical" }, { label: "Rescue Team (Boat)", swatch: "--info" }, { label: "Proposed route", swatch: "--primary", shape: "line" }]} />
          </div>
        ) : (
          <Panel className="h-[620px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr>{["ID", "Priority", "People", "District", "Status", "Team", "Reported"].map((h) => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>{list.map((i) => (
                <tr key={i.id} onClick={() => select(i.id)} className={cn("cursor-pointer border-t border-border hover:bg-secondary/40", sel?.id === i.id && "bg-primary/5")}>
                  <td className="py-2.5 pr-3 font-semibold">{i.id}</td><td className="pr-3"><PriorityTag p={i.priority} /></td><td className="pr-3">{i.people}</td><td className="pr-3">{i.district}</td><td className="pr-3">{i.status}</td><td className="pr-3">{s.teams.find((t) => t.id === i.teamId)?.name ?? "—"}</td><td className="text-muted-foreground">{minsAgo(i.reportedAt)}</td>
                </tr>))}</tbody>
            </table>
          </Panel>
        )}

        {sel ? (
          <Panel className="max-h-[620px] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">{sel.id}</h3><PriorityTag p={sel.priority} /></div>
            <img src={sel.img} alt="Incident scene" loading="lazy" width={944} height={704} className="mt-3 h-36 w-full rounded-lg object-cover" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-secondary/50 p-2"><Users className="mb-1 h-4 w-4 text-primary" /><b className="text-sm">{sel.people}</b> people stranded</div>
              <div className="rounded-lg bg-secondary/50 p-2"><MapPin className="mb-1 h-4 w-4 text-primary" />Grid {sel.grid}<br />{sel.district}</div>
            </div>
            <div className="mt-3 text-xs font-semibold text-muted-foreground">Situation details</div>
            <p className="mt-1 text-sm">{sel.details}</p>
            {sel.phone && <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{sel.phone}</div>}
            {sel.needs && <div className="mt-2 flex flex-wrap gap-1">{sel.needs.map((n) => <Tag key={n} tone="primary">{n}</Tag>)}</div>}

            {tabOf(sel.status) === "Active" && canAct && (
              <>
                <div className="mt-4 text-xs font-semibold text-muted-foreground">Assign Rescue Team</div>
                <select value={team} onChange={(e) => setTeam(e.target.value)} className={cn(field, "mt-1.5")}>
                  <option value="">Select available team…</option>
                  {avail.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.type}) — {t.district}</option>)}
                </select>
                <div className="mt-4 text-xs font-semibold text-muted-foreground">Resource Checklist</div>
                <div className="mt-1.5 space-y-1.5">
                  {CHECK.map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!checks[c]} onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />{c}
                    </label>
                  ))}
                </div>
                {!review ? (
                  <Button className="mt-4 w-full" disabled={!team} onClick={() => setReview(true)}>Review Dispatch</Button>
                ) : (
                  <div className="mt-4 rounded-lg border border-primary/50 bg-primary/5 p-3 text-sm">
                    <div className="font-semibold">Confirm dispatch</div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.teams.find((t) => t.id === team)?.name} → {sel.id} · {Object.values(checks).filter(Boolean).length}/{CHECK.length} items checked</p>
                    <div className="mt-3 flex gap-2"><Button size="sm" variant="ghost" onClick={() => setReview(false)}>Back</Button><Button size="sm" className="flex-1" onClick={() => { s.assign(sel.id, team); setReview(false); }}>Confirm & dispatch</Button></div>
                  </div>
                )}
                {sel.status === "Received" && <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => s.advance(sel.id)}>Mark as verified</Button>}
              </>
            )}
            {tabOf(sel.status) !== "Active" && (
              <div className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Assigned team</div>
                <div className="font-semibold">{assignedTeam?.name ?? "—"}</div>
                <div className="mt-1 text-xs">Status: <span className="text-primary">{sel.status}</span></div>
                {canAct && sel.status !== "Medical handover" && <Button className="mt-3 w-full" size="sm" onClick={() => s.advance(sel.id)}>Advance to “{STEPS[stepIdx + 1]}”</Button>}
              </div>
            )}
          </Panel>
        ) : <Panel><p className="text-sm text-muted-foreground">Select an incident.</p></Panel>}
      </div>

      {sel && (
        <Panel title={<>Incident Timeline <span className="ml-2 text-sm font-normal text-muted-foreground">{sel.id}</span></>}>
          <div className="grid grid-cols-3 gap-y-4 md:grid-cols-6">
            {STEPS.map((st, k) => {
              const h = sel.history.find((x) => x.step === st);
              const done = k <= stepIdx;
              return (
                <div key={st} className="relative flex flex-col items-center text-center">
                  {k < STEPS.length - 1 && <div className={cn("absolute left-1/2 top-4 hidden h-0.5 w-full md:block", k < stepIdx ? "bg-primary" : "bg-border")} />}
                  <div className={cn("relative z-10 grid h-8 w-8 place-items-center rounded-full border-2", done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground", k === stepIdx && "ring-4 ring-primary/25")}>{done ? <Check className="h-4 w-4" /> : k + 1}</div>
                  <div className={cn("mt-2 text-sm font-semibold", !done && "text-muted-foreground")}>{st}</div>
                  <div className="text-xs text-muted-foreground">{h ? clock(h.at) : "Pending"}</div>
                  {h && <div className="text-[11px] text-muted-foreground">{h.note}</div>}
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
