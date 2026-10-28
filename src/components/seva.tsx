import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/data";

export const btn = cva("inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_20px_-6px_var(--primary)]",
      outline: "border border-primary/60 text-primary hover:bg-primary/10",
      ghost: "border border-border bg-secondary/40 text-foreground hover:bg-secondary",
      danger: "bg-critical text-destructive-foreground hover:brightness-110 shadow-[0_0_24px_-6px_var(--critical)]",
      subtle: "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
    },
    size: { sm: "h-8 px-3 text-xs", md: "h-10 px-4", lg: "h-12 px-6 text-base", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});
export function Button({ className, variant, size, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>) {
  return <button className={cn(btn({ variant, size }), className)} {...p} />;
}

const tag = cva("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", {
  variants: {
    tone: {
      critical: "border-critical/50 bg-critical/15 text-critical",
      high: "border-high/50 bg-high/15 text-high",
      medium: "border-medium/50 bg-medium/15 text-medium",
      low: "border-low/50 bg-low/15 text-low",
      info: "border-info/50 bg-info/15 text-info",
      primary: "border-primary/50 bg-primary/10 text-primary",
      muted: "border-border bg-secondary/60 text-muted-foreground",
    },
  },
  defaultVariants: { tone: "muted" },
});
export function Tag({ tone, className, children }: VariantProps<typeof tag> & { className?: string; children: ReactNode }) {
  return <span className={cn(tag({ tone }), className)}>{children}</span>;
}
export const toneOf = (p: Priority | string) => ({ Critical: "critical", High: "high", Medium: "medium", Low: "low" } as const)[p as Priority] ?? "muted";
export function PriorityTag({ p }: { p: Priority }) { return <Tag tone={toneOf(p)}>{p}</Tag>; }

export function Panel({ className, children, title, action }: { className?: string; children: ReactNode; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn("panel p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="text-base font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ icon, value, label, sub, tone = "primary" }: { icon: ReactNode; value: ReactNode; label: string; sub?: string; tone?: "primary" | "critical" | "high" | "success" | "info" }) {
  const t = { primary: "text-primary bg-primary/10", critical: "text-critical bg-critical/10", high: "text-high bg-high/10", success: "text-success bg-success/10", info: "text-info bg-info/10" }[tone];
  return (
    <div className="panel flex items-center gap-3 p-4">
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", t)}>{icon}</div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold leading-none">{value}</div>
        <div className="mt-1 text-sm text-foreground/90">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export function SimLabel({ children = "Simulated" }: { children?: ReactNode }) {
  return <Tag tone="medium">⚠ {children}</Tag>;
}

export const field = "h-10 w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";
export function Label({ children }: { children: ReactNode }) { return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>; }

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors", on ? "border-primary bg-primary/80" : "border-border bg-secondary")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all", on ? "left-6" : "left-0.5")} />
    </button>
  );
}

export function PageHeader({ eyebrow, title, desc, right }: { eyebrow?: string; title: ReactNode; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, className }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background/50 p-1", className)}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn("rounded-md px-3 py-1.5 text-xs font-semibold transition-colors", value === o.value ? "bg-primary/15 text-primary ring-1 ring-primary/60" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
