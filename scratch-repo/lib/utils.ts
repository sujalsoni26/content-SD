/** Join class names, skipping falsy values. Tiny stand-in for clsx. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
