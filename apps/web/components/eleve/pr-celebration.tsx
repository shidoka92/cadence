import { Flame } from "lucide-react";

export function PrCelebration({ pr }: { pr: { name: string; load: number; date: string } }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-acid/40 bg-acid/[0.07] max-w-2xl">
      <div className="h-1 caution-stripe" />
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="w-11 h-11 rounded-md bg-acid/15 text-acid flex items-center justify-center shrink-0 motion-safe:animate-pulse">
          <Flame size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-acid">Nouveau record</div>
          <div className="font-display text-lg font-semibold uppercase tracking-wide truncate">
            {pr.name} · <span className="text-acid">{pr.load} kg</span>
          </div>
          <div className="text-[11px] text-muted mt-0.5">Charge battue le {pr.date}. Continue comme ça.</div>
        </div>
      </div>
    </div>
  );
}
