import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { Button, Label, Panel, PageHeader, Segmented, Tag, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import { DISTRICTS, type AlertSource } from "@/lib/data";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/updates")({
  head: () => meta("Verified Updates", "Official and verified flood alerts, with citizen reports reviewed before they are shared."),
  component: Updates,
});

function Updates() {
  const s = useStore();
  const [f, setF] = useState<"All" | AlertSource>("All");
  const [district, setDistrict] = useState("All");
  const [text, setText] = useState("");
  const [d, setD] = useState("Nagaon");
  const official = s.role === "Operations Lead" || s.role === "Field Coordinator";
  const list = s.alerts.filter((a) => (f === "All" || a.source === f) && (district === "All" || a.district === district || a.district === "All"));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Trusted information" title="Verified Updates" desc="Only verified and government alerts are broadcast. Citizen reports stay flagged until reviewed." />
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Panel title="Alert feed" action={<div className="flex flex-wrap gap-2"><Segmented value={f} onChange={setF} options={(["All", "VERIFIED", "GOVT", "UNVERIFIED"] as const).map((v) => ({ value: v, label: v === "All" ? "All" : v.charAt(0) + v.slice(1).toLowerCase() }))} /><select value={district} onChange={(e) => setDistrict(e.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs"><option>All</option>{DISTRICTS.map((x) => <option key={x}>{x}</option>)}</select></div>}>
          <div className="space-y-2">
            {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No alerts match.</p>}
            {list.map((a) => (
              <div key={a.id} className={cn("flex gap-3 rounded-lg border bg-background/40 p-3", a.source === "UNVERIFIED" ? "border-dashed border-medium/50" : "border-border")}>
                {a.source === "UNVERIFIED" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-medium" /> : a.severity === "danger" ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-critical" /> : a.severity === "warning" ? <Info className="mt-0.5 h-5 w-5 shrink-0 text-high" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{a.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.district} · {a.time}{a.reporter && ` · ${a.reporter}`}</div>
                  {a.source === "UNVERIFIED" && official && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => s.verifyAlert(a.id, "VERIFIED")}><CheckCircle2 className="h-3.5 w-3.5" />Verify</Button>
                      <Button size="sm" variant="ghost" onClick={() => s.verifyAlert(a.id, "REJECT")}><XCircle className="h-3.5 w-3.5" />Dismiss</Button>
                    </div>
                  )}
                </div>
                <div className="shrink-0"><Tag tone={a.source === "GOVT" ? "info" : a.source === "VERIFIED" ? "low" : "medium"}>{a.source === "UNVERIFIED" ? "Unverified" : a.source}</Tag></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={official ? "Publish an alert" : "Report something"} className="h-fit">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (text.trim().length < 10) return toast.error("Please write at least 10 characters"); s.addAlert({ text, district: d, source: official ? "VERIFIED" : "UNVERIFIED", severity: "warning", reporter: official ? undefined : `${s.role} report` }); setText(""); }}>
            <div><Label>Message</Label><textarea className={cn(field, "h-28 py-2")} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's happening, where?" /></div>
            <div><Label>District</Label><select className={field} value={d} onChange={(e) => setD(e.target.value)}>{DISTRICTS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <Button type="submit" className="w-full">{official ? "Publish verified alert" : "Submit for verification"}</Button>
            {!official && <p className="text-xs text-muted-foreground">Your report will be reviewed by officials before being marked verified.</p>}
          </form>
        </Panel>
      </div>
    </div>
  );
}
