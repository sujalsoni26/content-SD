import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-24 sm:px-6">
      <p className="font-mono text-sm font-semibold text-bad">404 · route not found</p>
      <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] text-ink">This box isn’t on the blueprint</h1>
      <p className="text-lg text-ink-2">The page you asked for doesn’t exist. The roadmap lists every lesson.</p>
      <div className="flex gap-3">
        <Link href="/learn" className={buttonClasses("primary")}>
          Open the roadmap
        </Link>
        <Link href="/" className={buttonClasses("ghost")}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
