import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-acid text-on-acid hover:brightness-110",
  secondary: "border border-line2 bg-transparent text-text hover:bg-surf",
  ghost: "text-muted hover:text-text hover:bg-surf",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "font-display font-semibold uppercase tracking-wide rounded-md cursor-pointer transition",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
