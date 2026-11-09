"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flag } from "@/components/Flag";
import type { SearchEntry } from "@/lib/data";

export function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return entries
      .filter((entry) =>
        `${entry.title} ${entry.subtitle}`.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [entries, query]);

  return (
    <div>
      <label htmlFor="site-search" className="eyebrow">
        Search everything
      </label>
      <input
        id="site-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Messi, Brazil, 1974, Real Madrid…"
        className="field mt-2 max-w-xl"
        type="search"
        autoFocus
      />

      <p className="mt-4 text-[12px] text-muted" aria-live="polite">
        {query
          ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”`
          : `${entries.length} records indexed across players, nations, clubs and tournaments.`}
      </p>

      {query && results.length === 0 && (
        <div className="card mt-6 grid place-items-center px-6 py-16 text-center">
          <p className="display text-2xl">Nothing matches “{query}”</p>
          <p className="mt-2 max-w-sm text-[13px] text-muted">
            The atlas only searches what it actually holds. Try a surname, a nation or a World Cup year.
          </p>
        </div>
      )}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {results.map((entry) => (
          <li key={entry.id}>
            <Link
              href={entry.href}
              className="flex items-center gap-3 py-3 transition-colors duration-150 ease-out hover:bg-[var(--surface-raised)]"
            >
              <span className="flex w-6 justify-center">
                {entry.code ? <Flag code={entry.code} size="sm" /> : <span aria-hidden="true" className="text-muted">⬤</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{entry.title}</span>
                <span className="block truncate text-[11px] text-muted">{entry.subtitle}</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted">{entry.kind}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
