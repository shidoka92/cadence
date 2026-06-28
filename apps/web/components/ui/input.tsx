import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-surf2 border border-line2 rounded-md px-3.5 py-3 text-sm text-text placeholder:text-ghost outline-none transition focus:border-acid/60",
        className
      )}
      {...props}
    />
  );
}
