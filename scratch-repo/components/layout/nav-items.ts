import { BookOpen, ChartNoAxesColumn, Dumbbell, House, Library, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/glossary", label: "Glossary", icon: Library },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
