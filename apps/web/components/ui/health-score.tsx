import { cn } from "@/lib/cn";

function tone(score: number) {
  if (score >= 70) return { text: "text-ok", bar: "bg-ok" };
  if (score >= 50) return { text: "text-warn", bar: "bg-warn" };
  return { text: "text-risk", bar: "bg-risk" };
}

export function HealthScore({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const t = tone(score);
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className={cn("font-display font-bold leading-none", size === "lg" ? "text-5xl" : "text-2xl", t.text)}>{score}</div>
        <div className="font-mono text-[8px] text-ghost mt-1">/100</div>
      </div>
      <div className="flex-1 h-1 rounded bg-surf2 overflow-hidden min-w-[60px]">
        <div className={cn("h-full rounded", t.bar)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
