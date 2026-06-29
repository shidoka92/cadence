import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon: LucideIcon; title: string; description?: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-10", className)}>
      <div className="w-12 h-12 rounded-full bg-surf2 border border-line2 flex items-center justify-center mb-3.5 text-ghost">
        <Icon size={20} />
      </div>
      <div className="font-display text-sm font-semibold uppercase tracking-wide mb-1">{title}</div>
      {description && <p className="text-xs text-muted max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
