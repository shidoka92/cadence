import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Variant = "default" | "cours" | "open" | "done" | "warn" | "risk" | "now";

const variants: Record<Variant, string> = {
  default: "border border-line2 text-muted",
  cours: "bg-acid/15 text-acid border border-acid/40",
  open: "bg-violet/15 text-violet border border-violet/40",
  done: "bg-ok/15 text-ok border border-ok/40",
  warn: "bg-warn/15 text-warn border border-warn/40",
  risk: "bg-risk/15 text-risk border border-risk/40",
  now: "bg-acid text-on-acid font-bold",
};

export function Badge({ variant = "default", className, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn("inline-flex items-center font-mono text-[9px] uppercase tracking-wider rounded-full px-2.5 py-1", variants[variant], className)}
      {...props}
    />
  );
}
