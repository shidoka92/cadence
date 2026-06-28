import { cn } from "@/lib/cn";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div className={cn("rounded-full bg-surf2 border border-line2 flex items-center justify-center font-mono text-xs text-muted shrink-0", className)}>
      {initials}
    </div>
  );
}
