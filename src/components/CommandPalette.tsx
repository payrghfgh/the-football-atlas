"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "@/components/Flag";
import type { SearchEntry } from "@/lib/data";

const KIND_LABEL: Record<SearchEntry["kind"], string> = {
  player: "Player",
  country: "Country",
  club: "Club",
  tournament: "World Cup",
};

function score(entry: SearchEntry, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const title = entry.title.toLowerCase();
  const subtitle = entry.subtitle.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 80;
  if (subtitle.includes(q)) return 50;
  // subsequence match — "lmssi" finds "Lionel Messi"
  let index = 0;
  let gaps = 0;
  for (const char of title) {
    if (char === q[index]) index += 1;
    else if (index > 0) gaps += 1;
    if (index === q.length) break;
  }
  if (index === q.length) return Math.max(10, 40 - gaps);
  return -1;
}

export function CommandPalette({
  entries,
  open,
  onOpenChange,
}: {
  entries: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) {
      return entries
        .filter((entry) => entry.kind === "player")
        .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
        .slice(0, 7);
    }
    return entries
      .map((entry) => ({ entry, value: score(entry, query) }))
      .filter((hit) => hit.value >= 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((hit) => hit.entry);
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((value) => (value + 1) % Math.max(results.length, 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((value) => (value - 1 + results.length) % Math.max(results.length, 1));
      }
      if (event.key === "Enter" && results[active]) {
        event.preventDefault();
        onOpenChange(false);
        router.push(results[active].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onOpenChange, open, results, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the atlas"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="card relative w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span aria-hidden="true" className="text-muted">
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players, countries, clubs, World Cups…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            aria-label="Search query"
            aria-controls="atlas-search-results"
            aria-activedescendant={results[active] ? `atlas-result-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
            autoComplete="off"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">
            esc
          </kbd>
        </div>
        <ul id="atlas-search-results" role="listbox" className="max-h-[52vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted">
              No matches for “{query}”. Try a surname, a country or a year.
            </li>
          )}
          {results.map((entry, index) => (
            <li key={entry.id} id={`atlas-result-${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  onOpenChange(false);
                  router.push(entry.href);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ease-out ${
                  index === active ? "bg-[var(--accent-soft)]" : ""
                }`}
              >
                <span className="flex w-6 justify-center">
                  {entry.code ? (
                    <Flag code={entry.code} size="sm" />
                  ) : (
                    <span aria-hidden="true" className="text-[11px] text-muted">
                      ⬤
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{entry.title}</span>
                  <span className="block truncate text-[11px] text-muted">{entry.subtitle}</span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-muted">
                  {KIND_LABEL[entry.kind]}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-muted">
          <span>↑ ↓ to move · ↵ to open</span>
          <span>{entries.length} indexed records</span>
        </div>
      </div>
    </div>
  );
}
