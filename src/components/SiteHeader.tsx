"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SearchEntry } from "@/lib/data";

const NAV = [
  { href: "/players", label: "Players" },
  { href: "/countries", label: "Countries" },
  { href: "/clubs", label: "Clubs" },
  { href: "/timeline", label: "Timeline" },
  { href: "/compare", label: "Compare" },
  { href: "/play", label: "Play" },
  { href: "/about", label: "About" },
];

export function SiteHeader({
  entries,
  playerIds,
}: {
  entries: SearchEntry[];
  playerIds: string[];
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function randomPlayer() {
    const id = playerIds[Math.floor(Math.random() * playerIds.length)];
    if (id) router.push(`/players/${id}`);
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--accent-ink)]"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="shell flex h-16 items-center gap-4">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="The Football Atlas — home">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full border border-line-strong text-[15px] font-semibold text-[var(--accent-text)]"
            >
              ◉
            </span>
            <span className="display text-[22px] leading-none tracking-wide">
              Football <span className="text-[var(--accent-text)]">Atlas</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 xl:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out hover:text-ink ${
                    active ? "bg-[var(--accent-soft)] text-ink" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="btn h-9 gap-2 !px-3 text-muted"
              aria-label="Search the atlas"
            >
              <span aria-hidden="true">⌕</span>
              <span className="hidden text-[12px] sm:inline">Search</span>
              <kbd className="hidden rounded border border-line px-1.5 text-[10px] sm:inline">/</kbd>
            </button>
            <button
              type="button"
              onClick={randomPlayer}
              className="btn hidden h-9 !px-3 text-[12px] md:inline-flex"
              aria-label="Open a random player page"
            >
              Random
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="btn h-9 w-9 !px-0 xl:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
            >
              <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line xl:hidden">
            <div className="shell grid grid-cols-2 gap-1 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-[var(--surface-raised)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <CommandPalette entries={entries} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
