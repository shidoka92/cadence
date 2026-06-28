import { cn } from "@/lib/cn";

export function HealthBreakdown({ factors }: { factors: { label: string; value: number }[] }) {
  return (
    <div className="space-y-2.5">
      {factors.map((f) => {
        const good = f.value >= 70;
        return (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-xs text-muted w-24 shrink-0">{f.label}</span>
            <div className="flex-1 h-1.5 rounded bg-surf2 overflow-hidden">
              <div className={cn("h-full rounded", good ? "bg-ok" : "bg-warn")} style={{ width: `${f.value}%` }} />
            </div>
            <span className={cn("font-mono text-[11px] w-7 text-right", good ? "text-ok" : "text-warn")}>{f.value}</span>
          </div>
        );
      })}
    </div>
  );
}
