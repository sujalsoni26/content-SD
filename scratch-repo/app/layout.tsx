import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/layout/app-providers";
import { MobileNav, SiteHeader } from "@/components/layout/site-header";
import { ThemeScript } from "@/components/layout/theme-script";
import { SvgMarkers } from "@/components/ui/svg-markers";
import { Companion } from "@/components/companion/companion";
import "./globals.css";

const atkinson = localFont({
  src: [
    { path: "./fonts/atkinson-normal.woff2", style: "normal" },
    { path: "./fonts/atkinson-italic.woff2", style: "italic" },
  ],
  weight: "200 800",
  variable: "--font-atkinson",
  display: "swap",
});
const bricolage = localFont({ src: "./fonts/bricolage-normal.woff2", weight: "200 800", variable: "--font-bricolage", display: "swap" });
const jetbrains = localFont({ src: "./fonts/jetbrains-normal.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Box by Box: learn system design", template: "%s · Box by Box" },
  description: "Learn system design one problem at a time: grow one app from a single server to millions of users.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c111e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${atkinson.variable} ${bricolage.variable} ${jetbrains.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-accent px-4 py-2 font-bold text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Skip to content
        </a>
        <SvgMarkers />
        <AppProviders>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <footer className="mx-auto max-w-[90rem] px-4 pb-28 pt-12 text-sm text-ink-3 sm:px-6 md:pb-12">
            Box by Box · system design from one server to millions. Progress is saved in this browser.
          </footer>
          <MobileNav />
          <Companion />
        </AppProviders>
      </body>
    </html>
  );
}
