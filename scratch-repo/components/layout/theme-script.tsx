import { STORAGE_KEYS } from "@/lib/storage/adapter";

/**
 * Runs before first paint: applies the saved theme and motion preference to <html>
 * so there is no light/dark flash and no hydration mismatch in client components.
 */
const script = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(STORAGE_KEYS.preferences)});var s=raw?JSON.parse(raw).state||{}:{};var t=s.theme||"system";var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);var m=s.companion&&s.companion.animations;if(m==="reduced"||m==="off")r.setAttribute("data-motion",m);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
