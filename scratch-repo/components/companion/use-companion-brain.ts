"use client";
import { useEffect, useRef } from "react";
import { onCompanionEvent } from "@/lib/companion-events";
import { lessonFromPath } from "@/lib/companion/lesson-context";
import {
  announceUnlocks,
  maybeGreet,
  maybeLessonTip,
  maybeWelcomeBack,
  reactToEvent,
  reactToFocusEvent,
} from "@/lib/companion/reactions";
import { TIMING } from "@/lib/companion/timing";
import { STORAGE_KEYS } from "@/lib/storage/adapter";
import { ensureFocusHydrated, syncFocusFromStorage, useCompanionStore, useFocusStore } from "@/stores/companion-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useProgressStore } from "@/stores/progress-store";

const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

/**
 * Local behaviour, no AI: listens to the app's companion events, tracks inactivity (sit after 45 s,
 * sleep after 2 min, wake on scroll / key / pointer), greets once per session, schedules lesson
 * tips, announces focus-timer phase changes and expires short reactions. All timers are one-shot.
 */
export function useCompanionBrain({ pathname, lessonSlug }: { pathname: string; lessonSlug?: string }) {
  const lessonRef = useRef(lessonSlug);
  useEffect(() => {
    lessonRef.current = lessonSlug;
  }, [lessonSlug]);

  // App events → reactions; lesson tips wait a moment and only fire if the learner is still there.
  useEffect(() => {
    let tipTimer = 0;
    const scheduleTip = (slug: string, delay: number) => {
      window.clearTimeout(tipTimer);
      tipTimer = window.setTimeout(() => {
        if (lessonFromPath(window.location.pathname)?.slug === slug) maybeLessonTip(slug, Date.now());
      }, delay);
    };
    const off = onCompanionEvent((event) => {
      if (event.type === "lesson-opened") scheduleTip(event.slug, TIMING.tipDelayMs);
      else reactToEvent(event, Date.now());
    });
    // The page may have announced its lesson before the companion mounted (first load).
    const initial = lessonFromPath(window.location.pathname);
    if (initial) scheduleTip(initial.slug, TIMING.tipDelayMs + TIMING.greetingDelayMs);
    return () => {
      off();
      window.clearTimeout(tipTimer);
    };
  }, []);

  // Once per browser session: hello, or "continue where you left off".
  useEffect(() => {
    const id = window.setTimeout(() => maybeGreet(lessonRef.current, Date.now()), TIMING.greetingDelayMs);
    return () => window.clearTimeout(id);
  }, []);

  // Navigation closes the menu and plain bubbles (bubbles with buttons stay until answered).
  useEffect(() => {
    const s = useCompanionStore.getState();
    s.closeMenu();
    s.dismissPlain();
  }, [pathname]);

  // Inactivity: awake → sitting → asleep. Activity only stamps a time; one timeout re-arms itself.
  useEffect(() => {
    let last = Date.now();
    let asleepSince = 0;
    let timer = 0;
    const arm = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, Math.max(250, ms));
    };
    const check = () => {
      const s = useCompanionStore.getState();
      if (s.napping) {
        timer = 0; // napping on request: only the menu, a tap or a pet wakes her
        return;
      }
      const busy = s.menuOpen || Boolean(s.bubble?.actions?.length) || useFocusStore.getState().session?.phase === "focus";
      const idle = Date.now() - last;
      if (busy) {
        if (s.idleLevel !== 0) s.setIdleLevel(0);
        arm(TIMING.settleMs);
        return;
      }
      if (idle >= TIMING.sleepMs) {
        if (s.idleLevel !== 2) {
          s.dismissPlain();
          s.setIdleLevel(2);
          asleepSince = Date.now();
        }
        timer = 0; // stays asleep until activity
        return;
      }
      if (idle >= TIMING.settleMs) {
        s.setIdleLevel(1);
        arm(TIMING.sleepMs - idle);
        return;
      }
      arm(TIMING.settleMs - idle);
    };
    const onActivity = () => {
      const now = Date.now();
      last = now;
      const s = useCompanionStore.getState();
      if (s.napping) return;
      if (s.idleLevel === 2) {
        s.setIdleLevel(0);
        s.react("happy", 900);
        maybeWelcomeBack(now - asleepSince, now);
        arm(TIMING.settleMs);
      } else if (s.idleLevel === 1) {
        s.setIdleLevel(0);
      }
      if (!timer) arm(TIMING.settleMs);
    };
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true, capture: true });
    arm(TIMING.settleMs);
    return () => {
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, onActivity);
      window.removeEventListener("scroll", onActivity, { capture: true });
      window.clearTimeout(timer);
    };
  }, []);

  // Short reactions expire on their own.
  const reaction = useCompanionStore((s) => s.reaction);
  useEffect(() => {
    if (!reaction) return;
    const id = window.setTimeout(
      () => useCompanionStore.getState().clearReaction(reaction.id),
      Math.max(0, reaction.until - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [reaction]);

  // Wardrobe: announce newly unlocked accessories once, shortly after the progress that earned them.
  useEffect(() => {
    let timer = 0;
    const run = () => {
      if (!announceUnlocks()) timer = window.setTimeout(run, 20_000);
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 1500);
    };
    const offProgress = useProgressStore.subscribe(schedule);
    const offPrefs = usePreferencesStore.subscribe((state, prev) => {
      if (state.companion.stats !== prev.companion.stats) schedule();
    });
    timer = window.setTimeout(run, TIMING.greetingDelayMs + 2500);
    return () => {
      offProgress();
      offPrefs();
      window.clearTimeout(timer);
    };
  }, []);

  // Focus timer: load it, follow other tabs, and announce phase changes.
  useEffect(() => {
    ensureFocusHydrated();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.focus) syncFocusFromStorage();
    };
    window.addEventListener("storage", onStorage);
    const off = useFocusStore.subscribe((state, prev) => {
      if (state.lastEvent && state.lastEvent !== prev.lastEvent) reactToFocusEvent(state.lastEvent, Date.now());
    });
    return () => {
      window.removeEventListener("storage", onStorage);
      off();
    };
  }, []);
}
