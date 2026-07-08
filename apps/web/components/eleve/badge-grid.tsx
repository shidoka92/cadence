import { Dumbbell, Flame, Trophy, Lock, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Badge, BadgeTier } from "@/lib/momentum";

const TIER_ICON: Record<BadgeTier, LucideIcon> = {
  sessions: Dumbbell,
  streak: Flame,
  pr: Trophy,
};

function BadgeTile({ badge }: { badge: Badge }) {
  const Icon = badge.unlocked ? TIER_ICON[badge.tier] : Lock;
  const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));

  return (
    <div
      className={cn(
        "rounded-md border p-3 flex flex-col gap-2",
        badge.unlocked ? "border-acid/30 bg-acid/[0.05]" : "border-line bg-surf"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
            badge.unlocked ? "bg-acid/15 text-acid" : "bg-surf2 text-ghost"
          )}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <div className={cn("font-display text-[13px] font-semibold uppercase tracking-wide truncate", !badge.unlocked && "text-muted")}>
            {badge.label}
          </div>
          <div className="text-[10.5px] text-ghost truncate">{badge.caption}</div>
        </div>
      </div>
      {!badge.unlocked && (
        <div className="mt-0.5">
          <div className="h-1 rounded-full bg-surf2 overflow-hidden">
            <div className="h-full bg-line2" style={{ width: `${pct}%` }} />
          </div>
          <div className="font-mono text-[9px] text-ghost mt-1 tracking-wider">
            {badge.current} / {badge.target}
          </div>
        </div>
      )}
    </div>
  );
}

export function BadgeGrid({ badges, unlocked }: { badges: Badge[]; unlocked: number }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Jalons</CardTitle>
        <span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">{unlocked} DÉBLOQUÉS</span>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4">
        {badges.map((b) => (
          <BadgeTile key={b.id} badge={b} />
        ))}
      </div>
    </Card>
  );
}
