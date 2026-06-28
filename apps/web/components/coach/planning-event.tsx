import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui";

export type PlanningEventData = {
  type: "cours" | "open";
  title: string;
  time: string;
  host?: string;
  capacity?: string;
  slots?: string;
  level?: string;
  pricing?: "included" | "paid";
  price?: string;
  flagged?: boolean;
};

export function PlanningEvent({ e }: { e: PlanningEventData }) {
  const isCours = e.type === "cours";
  return (
    <div className={cn(
      "rounded-md border p-2.5",
      isCours ? "bg-acid/10 border-acid/30" : "bg-violet/10 border-violet/30",
      e.flagged && "bg-risk/10 border-risk/50"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-mono text-[10px] text-ghost">{e.time}</span>
        {isCours
          ? <Badge variant="cours" className="ml-auto">{e.pricing === "paid" ? e.price : "INCLUS"}</Badge>
          : <Badge variant="open" className="ml-auto">OUVERTE</Badge>}
      </div>
      <div className="font-display text-[13px] font-semibold uppercase tracking-wide leading-tight">{e.title}</div>
      <div className="font-mono text-[10px] text-muted mt-1">
        {isCours ? `${e.capacity} · ${e.level}` : `hôte ${e.host} · ${e.slots}`}
      </div>
      {e.flagged && (
        <div className="flex items-center justify-between mt-1.5">
          <Badge variant="risk">⚠ à modérer</Badge>
          <button className="font-display text-[10px] font-semibold uppercase tracking-wide text-risk">Modérer</button>
        </div>
      )}
    </div>
  );
}
