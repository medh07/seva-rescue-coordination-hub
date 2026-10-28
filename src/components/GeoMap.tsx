import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { cn } from "@/lib/utils";

export type PinKind = "sos" | "team" | "shelter" | "medical" | "ngo" | "task" | "town" | "sector" | "lastseen";
export interface Pin { id: string; lat: number; lng: number; kind: PinKind; text?: string; label?: string; tip?: string; variant?: "medium" | "low"; selected?: boolean; pulse?: boolean; onClick?: () => void; }
export interface Line { points: [number, number][]; color: string; weight?: number; dashed?: boolean; opacity?: number; }
export interface Circle { lat: number; lng: number; radius: number; color: string; opacity?: number; dashed?: boolean; }
export interface Rect { id: string; bounds: [[number, number], [number, number]]; color: string; opacity: number; label?: string; selected?: boolean; onClick?: () => void; }
export interface Poly { points: [number, number][]; color: string; opacity?: number; label?: string; }

interface Props {
  center: [number, number]; zoom: number; className?: string;
  pins?: Pin[]; lines?: Line[]; circles?: Circle[]; rects?: Rect[]; polys?: Poly[];
  onMapClick?: (lat: number, lng: number) => void; fitTo?: [number, number] | null;
}

const css = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || v;
const col = (c: string) => (c.startsWith("--") ? css(c) : c);

export function GeoMap({ center, zoom, className, pins = [], lines = [], circles = [], rects = [], polys = [], onMapClick, fitTo }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const draw = useRef<() => void>(() => {});

  draw.current = () => {
    const lf = L.current; const g = layer.current;
    if (!lf || !g) return;
    g.clearLayers();
    polys.forEach((p) => lf.polygon(p.points, { color: col(p.color), weight: 1, fillOpacity: p.opacity ?? 0.3 }).addTo(g));
    lines.forEach((l) => lf.polyline(l.points, { color: col(l.color), weight: l.weight ?? 3, opacity: l.opacity ?? 0.9, dashArray: l.dashed ? "8 8" : undefined, lineCap: "round" }).addTo(g));
    circles.forEach((c) => lf.circle([c.lat, c.lng], { radius: c.radius, color: col(c.color), weight: c.dashed ? 2 : 0, dashArray: c.dashed ? "6 6" : undefined, fillOpacity: c.opacity ?? 0.3 }).addTo(g));
    rects.forEach((r) => {
      const rc = lf.rectangle(r.bounds, { color: r.selected ? col("--primary") : col("--foreground"), weight: r.selected ? 3 : 0.5, opacity: r.selected ? 1 : 0.35, fillColor: col(r.color), fillOpacity: r.opacity }).addTo(g);
      if (r.onClick) rc.on("click", (e) => { lf.DomEvent.stopPropagation(e); r.onClick!(); });
      if (r.label) lf.marker(rc.getBounds().getCenter(), { interactive: false, icon: lf.divIcon({ className: "seva-grid-label", html: r.label, iconSize: [30, 16] }) }).addTo(g);
    });
    pins.forEach((p) => {
      const size = p.kind === "town" ? 8 : 30;
      const icon = lf.divIcon({
        className: "",
        html: p.kind === "town"
          ? `<div style="display:flex;align-items:center;gap:6px"><div class="seva-pin town"></div><span class="seva-label">${p.label ?? ""}</span></div>`
          : `<div class="seva-pin ${p.kind} ${p.variant ?? ""} ${p.selected ? "selected" : ""} ${p.pulse ? "pulse" : ""}"><span>${p.text ?? ""}</span></div>${p.label ? `<div class="seva-label" style="margin-top:2px">${p.label}</div>` : ""}`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      });
      const mk = lf.marker([p.lat, p.lng], { icon }).addTo(g);
      if (p.tip) mk.bindTooltip(p.tip, { className: "seva-tip", direction: "top", offset: [0, -14] });
      if (p.onClick) mk.on("click", (e) => { lf.DomEvent.stopPropagation(e); p.onClick!(); });
    });
  };

  useEffect(() => {
    let alive = true;
    import("leaflet").then((mod) => {
      if (!alive || !el.current || map.current) return;
      const lf = (mod as unknown as { default?: typeof Leaflet }).default ?? (mod as unknown as typeof Leaflet);
      L.current = lf;
      const m = lf.map(el.current, { center, zoom, zoomControl: true, attributionControl: true, scrollWheelZoom: true });
      lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { className: "seva-tiles", attribution: "Imagery © Esri", maxZoom: 17 }).addTo(m);
      lf.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { opacity: 0.55, maxZoom: 17 }).addTo(m);
      layer.current = lf.layerGroup().addTo(m);
      m.on("click", (e) => clickRef.current?.(e.latlng.lat, e.latlng.lng));
      map.current = m;
      draw.current();
      setTimeout(() => m.invalidateSize(), 50);
    });
    return () => { alive = false; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw.current(); });
  useEffect(() => { if (fitTo && map.current) map.current.flyTo(fitTo, Math.max(map.current.getZoom(), 9), { duration: 0.6 }); }, [fitTo?.[0], fitTo?.[1]]);

  return <div ref={el} className={cn("relative z-0 h-full w-full overflow-hidden rounded-xl", className)} />;
}

export function MapLegend({ items, title = "Legend", className }: { items: { label: string; swatch: string; shape?: "dot" | "square" | "line" }[]; title?: string; className?: string }) {
  return (
    <div className={cn("pointer-events-auto absolute z-[500] rounded-lg border border-border bg-popover/90 p-3 text-xs backdrop-blur", className)}>
      <div className="mb-2 font-semibold">{title}</div>
      <div className="space-y-1.5">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-2 text-muted-foreground">
            <span className={cn("inline-block shrink-0", i.shape === "line" ? "h-1 w-4 rounded" : i.shape === "square" ? "h-3 w-3 rounded-sm" : "h-3 w-3 rounded-full")} style={{ background: `var(${i.swatch})` }} />
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}
