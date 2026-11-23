import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold leading-tight transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out select-none disabled:cursor-not-allowed disabled:opacity-50 enabled:active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink border border-accent shadow-[0_2px_0_color-mix(in_srgb,var(--accent)_55%,var(--ink))] enabled:hover:brightness-110",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-[0_1.5px_0_var(--line-strong)] enabled:hover:border-ink-3",
  ghost: "bg-transparent text-ink-2 border border-transparent enabled:hover:bg-surface-2 enabled:hover:text-ink",
  danger: "bg-bad text-accent-ink border border-bad enabled:hover:brightness-110",
  success: "bg-good text-accent-ink border border-good enabled:hover:brightness-110",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-[0.82rem]",
  md: "px-4 py-2.5 text-[0.92rem]",
  lg: "px-5 py-3 text-base rounded-xl",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
