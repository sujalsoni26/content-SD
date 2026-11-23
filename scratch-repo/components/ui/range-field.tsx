import { useId } from "react";
import { cn } from "@/lib/utils";

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Text shown next to the slider, e.g. "200 ms". Defaults to the raw value. */
  display?: string;
  className?: string;
}

export function RangeField({ label, value, min, max, step = 1, onChange, display, className }: RangeFieldProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", className)}>
      <label htmlFor={id} className="font-bold text-ink-2">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-44 max-w-full accent-[var(--accent)]"
      />
      <output htmlFor={id} className="min-w-[4ch] font-mono text-[0.85rem] tabular-nums text-ink">
        {display ?? value}
      </output>
    </div>
  );
}
