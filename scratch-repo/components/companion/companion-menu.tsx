"use client";
import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { motion } from "motion/react";
import {
  Brain,
  Cat,
  ChevronLeft,
  Compass,
  EyeOff,
  Fish,
  Heart,
  Lightbulb,
  ListTree,
  MessageCircleQuestionMark,
  Moon,
  Settings,
  Shirt,
  Sun,
  Timer,
  Volleyball,
  type LucideIcon,
} from "lucide-react";
import {
  explainSimply,
  feedCache,
  giveHint,
  hideCompanion,
  meowAboutTopic,
  openWardrobe,
  petCache,
  playWithCache,
  quickRevision,
  suggestNext,
  toggleFocus,
  toggleNap,
  topicSummary,
} from "@/lib/companion/actions";
import { cn } from "@/lib/utils";
import { useCompanionStore, useFocusStore } from "@/stores/companion-store";
import type { Lesson } from "@/types/curriculum";
import { CompanionSettingsPanel } from "./companion-settings-panel";
import { Wardrobe } from "./wardrobe";

interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
  /** Opens a sub-view inside the menu instead of closing it. */
  subview?: boolean;
}

interface CompanionMenuProps {
  id: string;
  lesson?: Lesson;
  above: boolean;
  animated: boolean;
  /** The cat button: focus returns here, and clicks on it do not count as "outside". */
  anchorRef: RefObject<HTMLElement | null>;
}

/** Compact, keyboard-navigable menu (role="menu"): arrows, Home/End, Escape, Tab closes. */
export function CompanionMenu({ id, lesson, above, animated, anchorRef }: CompanionMenuProps) {
  const view = useCompanionStore((s) => s.menuView);
  const initialFocus = useCompanionStore((s) => s.menuFocus);
  const closeMenu = useCompanionStore((s) => s.closeMenu);
  const setMenuView = useCompanionStore((s) => s.setMenuView);
  const focusRunning = useFocusStore((s) => s.session !== null);
  const napping = useCompanionStore((s) => s.napping);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  const needs = lesson ? undefined : "needs a lesson";
  const items: MenuItem[] = [
    { id: "explain", label: "Explain simply", hint: needs, icon: Lightbulb, run: () => explainSimply(lesson) },
    { id: "hint", label: "Give me a hint", hint: needs, icon: MessageCircleQuestionMark, run: () => giveHint(lesson) },
    { id: "revise", label: "Quick revision", hint: "recall", icon: Brain, run: quickRevision },
    {
      id: "focus",
      label: focusRunning ? "Stop focus timer" : "Focus timer",
      hint: focusRunning ? "running" : "25 min",
      icon: Timer,
      run: toggleFocus,
    },
    { id: "summary", label: "Current topic summary", hint: needs, icon: ListTree, run: () => topicSummary(lesson) },
    { id: "next", label: "What should I learn next?", icon: Compass, run: () => suggestNext(lesson) },
    { id: "meow", label: "Meow about this topic", hint: lesson ? undefined : "general", icon: Cat, run: () => meowAboutTopic(lesson) },
  ];
  const playItems: MenuItem[] = [
    { id: "feed", label: "Feed", icon: Fish, run: feedCache },
    { id: "pet", label: "Pet", icon: Heart, run: () => petCache(lesson) },
    { id: "nap", label: napping ? "Wake up" : "Nap", icon: napping ? Sun : Moon, run: toggleNap },
    { id: "play", label: "Play", hint: "yarn", icon: Volleyball, run: playWithCache },
    { id: "wardrobe", label: "Wardrobe", icon: Shirt, run: openWardrobe, subview: true },
  ];
  const endItems: MenuItem[] = [
    { id: "hide", label: "Hide companion", icon: EyeOff, run: hideCompanion },
    { id: "settings", label: "Companion settings", icon: Settings, run: () => setMenuView("settings"), subview: true },
  ];

  const menuItems = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (view !== "main") {
      backRef.current?.focus({ preventScroll: true });
      return;
    }
    const list = listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (!list?.length) return;
    (initialFocus === "last" ? list[list.length - 1] : list[0]).focus({ preventScroll: true });
  }, [view, initialFocus]);

  // Close on a pointer press outside the menu and the cat.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target || rootRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      useCompanionStore.getState().closeMenu();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [anchorRef]);

  const closeToAnchor = () => {
    closeMenu();
    anchorRef.current?.focus({ preventScroll: true });
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      list[(to + list.length) % list.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        move(index + 1);
        break;
      case "ArrowUp":
        move(index - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(list.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        closeToAnchor();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  };

  const select = (item: MenuItem) => {
    if (item.subview) {
      item.run();
      return;
    }
    closeMenu();
    // Focus goes back to the cat first; a bubble that asks for focus then takes it.
    if (item.id !== "hide") anchorRef.current?.focus({ preventScroll: true });
    item.run();
  };

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        role="menuitem"
        tabIndex={-1}
        data-testid={`companion-menu-${item.id}`}
        onClick={() => select(item)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[0.88rem] font-semibold text-ink-2 transition-colors",
          "hover:bg-surface-2 hover:text-ink focus-visible:bg-accent-soft focus-visible:text-ink",
        )}
      >
        <Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">{item.label}</span>
        {item.hint ? <span className="shrink-0 font-mono text-[0.66rem] font-medium text-ink-3">{item.hint}</span> : null}
      </button>
    );
  };

  return (
    <motion.div
      ref={rootRef}
      initial={animated ? { opacity: 0, scale: 0.95, y: above ? 6 : -6 } : { opacity: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={animated ? { opacity: 0, scale: 0.97 } : { opacity: 0 }}
      transition={{ duration: animated ? 0.16 : 0.1, ease: "easeOut" }}
      style={{ originY: above ? 1 : 0 }}
      className="flex max-h-[inherit] flex-col"
    >
      <div className="min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-surface p-1.5 text-ink shadow-[var(--shadow-lift)]">
        <div className="flex items-baseline justify-between gap-2 px-2 pb-1 pt-1">
          <p className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-amber-ink">Cache</p>
          <p className="truncate text-[0.72rem] text-ink-3">{lesson ? `Lesson ${lesson.number} · ${lesson.title}` : "No lesson open"}</p>
        </div>

        {view === "main" ? (
          <div ref={listRef} id={id} role="menu" aria-label="Cache menu" data-testid="companion-menu" aria-orientation="vertical" onKeyDown={onMenuKeyDown}>
            {items.map(renderItem)}
            <div role="separator" className="mx-2 my-1 h-px bg-line" />
            <div role="group" aria-label="Play with Cache">
              <p aria-hidden="true" className="px-2 pb-0.5 pt-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-3">
                Play with Cache
              </p>
              {playItems.map(renderItem)}
            </div>
            <div role="separator" className="mx-2 my-1 h-px bg-line" />
            {endItems.map(renderItem)}
          </div>
        ) : (
          <div
            id={id}
            role="group"
            aria-label={view === "wardrobe" ? "Wardrobe" : "Companion settings"}
            data-testid={view === "wardrobe" ? "companion-menu-wardrobe-view" : "companion-menu-settings"}
            className="w-full px-2 pb-1"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setMenuView("main");
              }
            }}
          >
            <button
              ref={backRef}
              type="button"
              data-testid="companion-menu-back"
              onClick={() => setMenuView("main")}
              className="-ml-1 mb-1 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[0.8rem] font-bold text-accent hover:bg-surface-2"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Back to menu
            </button>
            {view === "wardrobe" ? <Wardrobe compact /> : <CompanionSettingsPanel compact />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
