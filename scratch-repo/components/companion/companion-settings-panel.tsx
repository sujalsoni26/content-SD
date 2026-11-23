"use client";
import { useId, useState, type ReactNode } from "react";
import { Eye, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { playBlip } from "@/lib/companion/sound";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useCompanionStore } from "@/stores/companion-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { AnimationLevel } from "@/types/companion";
import { Wardrobe } from "./wardrobe";

type OnOff = "on" | "off";
const ON_OFF = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
] as const;
const ANIMATIONS = [
  { value: "normal", label: "Normal" },
  { value: "reduced", label: "Reduced" },
  { value: "off", label: "Off" },
] as const;

const onOff = (v: boolean): OnOff => (v ? "on" : "off");

function Row({ title, description, compact, children }: { title: string; description: string; compact: boolean; children: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-4", compact ? "gap-y-1 py-1.5" : "gap-y-2 py-3")}>
      <div className="min-w-0 flex-1 basis-40">
        <p className={cn("font-bold text-ink", compact ? "text-[0.84rem]" : "text-[0.92rem]")}>{title}</p>
        {compact ? null : <p className="text-[0.82rem] leading-snug text-ink-3">{description}</p>}
      </div>
      {children}
    </div>
  );
}

interface CompanionSettingsPanelProps {
  /** Tighter layout without descriptions (used inside the companion menu). */
  compact?: boolean;
  className?: string;
}

/**
 * Companion settings: on/off, animations, physics, study tips, sound and reset position.
 * Everything persists through the preferences store. With the companion off, only a small
 * "Show companion" control (and the site-wide animations setting) remains.
 */
export function CompanionSettingsPanel({ compact = false, className }: CompanionSettingsPanelProps) {
  const hydrated = useHydrated();
  const settings = usePreferencesStore((s) => s.companion);
  const setCompanion = usePreferencesStore((s) => s.setCompanion);
  const setAnimations = usePreferencesStore((s) => s.setAnimations);
  const resetPosition = useCompanionStore((s) => s.resetPosition);
  const [note, setNote] = useState("");
  const headingId = useId();
  const size = "sm";

  const frame = cn(
    compact ? "text-ink" : "rounded-2xl border border-line bg-surface px-5 py-2 shadow-[var(--shadow-soft)]",
    className,
  );

  if (!hydrated) {
    return (
      <div className={frame} aria-busy="true">
        <p className="py-3 text-[0.88rem] text-ink-3">Loading companion settings…</p>
      </div>
    );
  }

  const animationsRow = (
    <Row
      title={settings.enabled ? "Animations" : "Site animations"}
      description="Reduced or Off also calms motion across the whole site."
      compact={compact}
    >
      <SegmentedControl<AnimationLevel>
        label="Animations"
        options={ANIMATIONS}
        value={settings.animations}
        onChange={setAnimations}
        size={size}
      />
    </Row>
  );

  if (!settings.enabled) {
    return (
      <section aria-labelledby={headingId} className={frame} data-testid="companion-settings">
        <h3 id={headingId} className="sr-only">
          Companion settings
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-[0.88rem] text-ink-3">Cache is hidden. Nothing floats on the page.</p>
          <Button size="sm" variant="secondary" data-testid="companion-show" onClick={() => setCompanion({ enabled: true })}>
            <Eye aria-hidden="true" className="size-4" />
            Show companion
          </Button>
        </div>
        <div className="border-t border-line">{animationsRow}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={frame} data-testid="companion-settings">
      <h3 id={headingId} className="sr-only">
        Companion settings
      </h3>
      <div className="divide-y divide-line">
        <Row title="Companion" description="Show Cache, the study cat, on every page." compact={compact}>
          <SegmentedControl<OnOff>
            label="Companion"
            options={ON_OFF}
            value="on"
            onChange={(v) => setCompanion({ enabled: v === "on" })}
            size={size}
          />
        </Row>
        {animationsRow}
        <Row
          title="Physics"
          description="Throw Cache and it glides, bounces softly and settles. Off: it just slides to a safe spot."
          compact={compact}
        >
          <SegmentedControl<OnOff>
            label="Physics"
            options={ON_OFF}
            value={onOff(settings.physics)}
            onChange={(v) => setCompanion({ physics: v === "on" })}
            size={size}
          />
        </Row>
        <Row
          title="Study tips"
          description="Unprompted tips and nudges. Answers to what you ask still appear."
          compact={compact}
        >
          <SegmentedControl<OnOff>
            label="Study tips"
            options={ON_OFF}
            value={onOff(settings.studyTips)}
            onChange={(v) => setCompanion({ studyTips: v === "on" })}
            size={size}
          />
        </Row>
        <Row title="Sound" description="Tiny, quiet blips. Off by default." compact={compact}>
          <SegmentedControl<OnOff>
            label="Sound"
            options={ON_OFF}
            value={onOff(settings.sound)}
            onChange={(v) => {
              setCompanion({ sound: v === "on" });
              if (v === "on") playBlip("happy");
            }}
            size={size}
          />
        </Row>
        <Row title="Position" description="Lost Cache behind something? Send it back to its corner." compact={compact}>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              data-testid="companion-reset-position"
              onClick={() => {
                resetPosition();
                setNote("Cache is back in its corner.");
              }}
            >
              <LocateFixed aria-hidden="true" className="size-4" />
              Reset position
            </Button>
          </div>
        </Row>
      </div>
      <p aria-live="polite" className={cn("text-[0.8rem] text-ink-3", note ? "pb-2" : "sr-only")}>
        {note}
      </p>
      {compact ? null : (
        <div className="border-t border-line py-3">
          <h4 className="font-bold text-ink">Wardrobe</h4>
          <p className="mb-2.5 text-[0.82rem] leading-snug text-ink-3">
            Accessories unlock as you learn, focus and play with Cache. One per slot; tap to wear or take off.
          </p>
          <Wardrobe />
        </div>
      )}
    </section>
  );
}
