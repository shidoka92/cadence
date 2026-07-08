import { Card, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { LeaderboardRow } from "@/lib/queries";

const MEDAL: Record<number, string> = { 1: "text-warn", 2: "text-muted", 3: "text-[#C97E4A]" };

export function LeaderboardCard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Classement de la classe</CardTitle>
        <span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">SÉANCES · 30 JOURS</span>
      </CardHeader>
      <div>
        {rows.map((r) => (
          <div
            key={r.studentId}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0",
              r.isMe && "bg-acid/[0.06]"
            )}
          >
            <span
              className={cn(
                "font-display text-sm font-semibold w-6 text-center tabular-nums",
                MEDAL[r.position] ?? "text-ghost"
              )}
            >
              {r.position}
            </span>
            <span className={cn("font-display text-[13px] font-semibold uppercase tracking-wide flex-1 truncate", r.isMe && "text-acid")}>
              {r.name}
              {r.isMe && <span className="ml-2 font-mono text-[9px] text-acid tracking-wider">TOI</span>}
            </span>
            <span className="font-mono text-sm tabular-nums">{r.sessions}</span>
            <span className="font-mono text-[10px] text-ghost">séances</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
