import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Label, Panel, PageHeader, Tag, Toggle, field } from "@/components/seva";
import { useStore } from "@/lib/store";
import { DISTRICTS, type Role } from "@/lib/data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/settings")({
  head: () => meta("Settings", "Manage your SEVA profile, role view, alerts, language and offline preferences."),
  component: Settings,
});

function Settings() {
  const s = useStore();
  const [confirm, setConfirm] = useState(false);
  const row = (label: string, desc: string, on: boolean, k: keyof typeof s.settings, sim?: boolean) => (
    <div className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-0">
      <div><div className="text-sm font-medium">{label} {sim && <Tag tone="medium">Simulated</Tag>}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      <Toggle on={on} onChange={(v) => s.setSettings({ [k]: v })} label={label} />
    </div>
  );
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Settings" desc="Preferences are saved on this device." />
      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Profile & role">
          <div className="space-y-3">
            <div><Label>Display name</Label><input className={field} value={s.settings.name} onChange={(e) => s.setSettings({ name: e.target.value })} /></div>
            <div><Label>Role view</Label><select className={field} value={s.role} onChange={(e) => s.setRole(e.target.value as Role)}>{(["Operations Lead", "Field Coordinator", "NGO Partner", "Citizen"] as Role[]).map((r) => <option key={r}>{r}</option>)}</select></div>
            <div><Label>Home district</Label><select className={field} value={s.settings.district} onChange={(e) => s.setSettings({ district: e.target.value })}><option>All Districts</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><Label>Language</Label><select className={field} value={s.settings.language} onChange={(e) => s.setSettings({ language: e.target.value })}>{["English", "অসমীয়া (Assamese)", "বাংলা (Bengali)", "हिन्दी (Hindi)"].map((l) => <option key={l}>{l}</option>)}</select></div>
          </div>
        </Panel>
        <Panel title="Alerts & connectivity">
          {row("SMS alerts", "Receive verified alerts by SMS", s.settings.smsAlerts, "smsAlerts")}
          {row("Push notifications", "Browser notifications for new SOS", s.settings.pushAlerts, "pushAlerts")}
          {row("Offline mode", "Queue SOS and updates for SMS fallback", s.settings.offline, "offline", true)}
          {row("Low-data maps", "Reduce map detail on slow networks", s.settings.lowData, "lowData", true)}
          {row("Auto-assign nearest team", "Suggest closest available team on new SOS", s.settings.autoAssign, "autoAssign")}
        </Panel>
      </div>
      <Panel title="Demo data">
        <p className="text-sm text-muted-foreground">All incidents, teams, shelters and predictions are realistic demo data. Resetting restores the original scenario.</p>
        <div className="mt-3 flex gap-2">{confirm ? <><Button variant="danger" onClick={() => { s.reset(); setConfirm(false); }}>Confirm reset</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></> : <Button variant="outline" onClick={() => setConfirm(true)}>Reset demo data</Button>}</div>
      </Panel>
    </div>
  );
}
