import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function ActionItem({ icon: Icon, iconClass, title, sub, time, href }: {
  icon: LucideIcon; iconClass: string; title: React.ReactNode; sub: string; time: string; href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-line last:border-0 hover:bg-hover cursor-pointer transition">
      <div className={cn("w-9 h-9 rounded-md flex items-center justify-center shrink-0", iconClass)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{title}</div>
        <div className="text-[11px] text-muted mt-0.5 truncate">{sub}</div>
      </div>
      <div className="font-mono text-[10px] text-ghost whitespace-nowrap">{time}</div>
    </Link>
  );
}
