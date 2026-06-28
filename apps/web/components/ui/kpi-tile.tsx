import { cn } from "@/lib/cn";
import { Card } from "./card";

export function KpiTile({ label, value, trend, accent }: { label: string; value: string; trend?: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ghost">{label}</div>
      <div className={cn("font-display font-bold text-4xl leading-none mt-2", accent && "text-acid")}>{value}</div>
      {trend && <div className="text-[11px] mt-2 text-muted">{trend}</div>}
    </Card>
  );
}
