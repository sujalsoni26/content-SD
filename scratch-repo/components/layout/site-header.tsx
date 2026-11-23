"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { overallProgress } from "@/lib/curriculum";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import { ProgressBar } from "@/components/ui/progress-bar";
import { isActive, navItems } from "./nav-items";
import { SearchDialog } from "./search-dialog";
import { ThemeToggle } from "./theme-toggle";

function BrandMark() {
  return (
    <span aria-hidden="true" className="grid grid-cols-2 gap-[3px] transition-transform duration-500 group-hover:rotate-90">
      <i className="block size-[9px] rounded-[2px] border-[1.8px] border-ink" />
      <i className="block size-[9px] rounded-[2px] border-[1.8px] border-accent bg-accent" />
      <i className="block size-[9px] rounded-[2px] border-[1.8px] border-amber bg-amber" />
      <i className="block size-[9px] rounded-[2px] border-[1.8px] border-ink" />
    </span>
  );
}

function CourseProgress() {
  const hydrated = useHydrated();
  const completed = useProgressStore((s) => s.completed);
  const p = overallProgress(hydrated ? completed : {});
  return (
    <Link href="/progress" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-surface-2" title="Course progress">
      <ProgressBar value={p.fraction} label="Course progress" valueText={`${p.done} of ${p.total} lessons complete`} size="sm" />
      <span className="w-[3.2rem] shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-ink-2">{hydrated ? `${Math.round(p.fraction * 100)}%` : "–"}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header data-companion-avoid="" className="sticky top-0 z-40 border-b border-line bg-header backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-lg text-ink" aria-label="Box by Box, dashboard">
          <BrandMark />
          <span className="hidden font-display text-lg font-bold tracking-[-0.01em] sm:inline">Box by Box</span>
        </Link>
        <nav aria-label="Main" className="ml-2 hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                      active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex min-w-0 max-w-xs flex-1 items-center">
          <CourseProgress />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <SearchDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Bottom tab bar on small screens. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      data-companion-avoid=""
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-header pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-bold",
                  active ? "text-accent" : "text-ink-3 hover:text-ink",
                )}
              >
                <Icon aria-hidden="true" className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
