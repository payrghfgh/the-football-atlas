"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag } from "@/components/Flag";
import { FictionalBadge } from "@/components/FictionalBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/lib/data";
import { orDash } from "@/lib/format";

type SortKey =
  | "name"
  | "nationality"
  | "position"
  | "era"
  | "club"
  | "careerGoals"
  | "internationalCaps"
  | "overall"
  | "heightCm"
  | "dateOfBirth";

type Filters = {
  q: string;
  country: string;
  position: string;
  era: string;
  confederation: string;
  minRating: string;
  foot: string;
  height: string;
  sort: SortKey;
  dir: "asc" | "desc";
};

const ROW_HEIGHT = 62;
const VIEWPORT = 620;
const OVERSCAN = 6;

const HEIGHT_BANDS: Record<string, [number, number]> = {
  under170: [0, 169],
  "170-179": [170, 179],
  "180-189": [180, 189],
  "190plus": [190, 260],
};

const SORTABLE: { key: SortKey; label: string; className: string; numeric?: boolean }[] = [
  { key: "name", label: "Player", className: "min-w-0 flex-[1.6]" },
  { key: "nationality", label: "Nation", className: "min-w-0 flex-[1.05]" },
  { key: "position", label: "Pos", className: "w-[68px]" },
  { key: "era", label: "Era", className: "hidden w-[104px] xl:flex" },
  { key: "club", label: "Clubs", className: "hidden min-w-0 flex-[1.5] xl:flex" },
  { key: "careerGoals", label: "Goals", className: "w-[68px] text-right", numeric: true },
  { key: "internationalCaps", label: "Caps", className: "w-[64px] text-right", numeric: true },
  { key: "overall", label: "OVR", className: "w-[62px] text-right", numeric: true },
];

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    country: params.get("country") ?? "",
    position: params.get("position") ?? "",
    era: params.get("era") ?? "",
    confederation: params.get("confederation") ?? "",
    minRating: params.get("minRating") ?? "",
    foot: params.get("foot") ?? "",
    height: params.get("height") ?? "",
    sort: (params.get("sort") as SortKey) ?? "overall",
    dir: (params.get("dir") as "asc" | "desc") ?? "desc",
  };
}

function fuzzy(haystack: string, query: string): number {
  const text = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  if (text.startsWith(q)) return 3;
  if (text.includes(q)) return 2;
  let index = 0;
  for (const char of text) {
    if (char === q[index]) index += 1;
    if (index === q.length) return 1;
  }
  return 0;
}

export function PlayersExplorer({
  players,
  countries,
  eras,
  confederations,
  total,
}: {
  players: Player[];
  countries: { id: string; name: string }[];
  eras: string[];
  confederations: string[];
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [draftQuery, setDraftQuery] = useState(filters.q);
  const [scrollTop, setScrollTop] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftQuery(filters.q);
  }, [filters.q]);

  const push = useCallback(
    (next: Partial<Filters>) => {
      const merged = { ...filters, ...next };
      const params = new URLSearchParams();
      if (merged.q) params.set("q", merged.q);
      if (merged.country) params.set("country", merged.country);
      if (merged.position) params.set("position", merged.position);
      if (merged.era) params.set("era", merged.era);
      if (merged.confederation) params.set("confederation", merged.confederation);
      if (merged.minRating) params.set("minRating", merged.minRating);
      if (merged.foot) params.set("foot", merged.foot);
      if (merged.height) params.set("height", merged.height);
      if (merged.sort !== "overall") params.set("sort", merged.sort);
      if (merged.dir !== "desc") params.set("dir", merged.dir);
      const query = params.toString();
      router.replace(query ? `/players?${query}` : "/players", { scroll: false });
    },
    [filters, router]
  );

  // "/" focuses the table's own search field (the palette owns the global one).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // debounce the search box into the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draftQuery !== filters.q) push({ q: draftQuery });
    }, 220);
    return () => clearTimeout(timer);
  }, [draftQuery, filters.q, push]);

  const filtered = useMemo(() => {
    const band = filters.height ? HEIGHT_BANDS[filters.height] : null;
    const rows = players.filter((player) => {
      if (filters.country && player.nationality !== filters.country) return false;
      if (filters.position && player.position !== filters.position && !player.secondaryPositions.includes(filters.position))
        return false;
      if (filters.era && player.era !== filters.era) return false;
      if (filters.confederation && player.confederation !== filters.confederation) return false;
      if (filters.minRating && player.overall < Number(filters.minRating)) return false;
      if (filters.foot && player.preferredFoot !== filters.foot) return false;
      if (band && (player.heightCm < band[0] || player.heightCm > band[1])) return false;
      if (filters.q) {
        const haystack = [
          player.name,
          player.fullName,
          player.nationality,
          player.position,
          player.era,
          player.clubs.join(" "),
          player.playStyles.join(" "),
        ].join(" ");
        if (!fuzzy(haystack, filters.q)) return false;
      }
      return true;
    });

    const direction = filters.dir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      const value = (player: Player): string | number => {
        switch (filters.sort) {
          case "name":
            return player.name;
          case "nationality":
            return player.nationality;
          case "position":
            return player.position;
          case "era":
            return player.dateOfBirth;
          case "club":
            return player.clubs[0] ?? "";
          case "careerGoals":
            return player.careerGoals ?? -1;
          case "internationalCaps":
            return player.internationalCaps ?? -1;
          case "heightCm":
            return player.heightCm;
          case "dateOfBirth":
            return player.dateOfBirth;
          case "overall":
          default:
            return player.overall;
        }
      };
      const left = value(a);
      const right = value(b);
      if (typeof left === "string" && typeof right === "string") {
        return left.localeCompare(right) * direction;
      }
      if (left === right) return a.name.localeCompare(b.name);
      return (Number(left) - Number(right)) * direction;
    });
  }, [filters, players]);

  useEffect(() => {
    setScrollTop(0);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [filters]);

  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(filtered.length, Math.ceil((scrollTop + VIEWPORT) / ROW_HEIGHT) + OVERSCAN);
  const visible = filtered.slice(start, end);

  const activeFilterCount = [
    filters.q,
    filters.country,
    filters.position,
    filters.era,
    filters.confederation,
    filters.minRating,
    filters.foot,
    filters.height,
  ].filter(Boolean).length;

  function toggleSort(key: SortKey) {
    if (filters.sort === key) {
      push({ dir: filters.dir === "asc" ? "desc" : "asc" });
    } else {
      push({ sort: key, dir: key === "name" || key === "nationality" || key === "club" ? "asc" : "desc" });
    }
  }

  function reset() {
    router.replace("/players", { scroll: false });
  }

  return (
    <div className="shell pb-24 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Players</p>
          <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">The player index</h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
            <strong className="text-ink">Showing {filtered.length} players</strong> of {total} in this
            dataset. The defined scope is every player who appeared in a World Cup squad from 1930 to
            2022 plus a 2026 pool and current internationals — this build ships a curated subset, and
            the gap is stated on the{" "}
            <Link href="/about#scope" className="link-underline">
              About page
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} className="btn" disabled={activeFilterCount === 0}>
            Reset filters
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
          >
            Copy link
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- filters */}
      <section aria-label="Filters" className="card mt-8 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="eyebrow">Search</span>
            <input
              ref={searchRef}
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Name, club, play style…  ( / )"
              className="field mt-1.5"
              type="search"
              aria-label="Search players by name, club or play style"
            />
          </label>

          <label className="block">
            <span className="eyebrow">Nation</span>
            <select
              value={filters.country}
              onChange={(event) => push({ country: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">All nations</option>
              {countries.map((country) => (
                <option key={country.id} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Position</span>
            <select
              value={filters.position}
              onChange={(event) => push({ position: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">All positions</option>
              {["GK", "CB", "LB", "RB", "DM", "CM", "CAM", "LW", "RW", "CF", "SS", "ST"].map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Era</span>
            <select
              value={filters.era}
              onChange={(event) => push({ era: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">All eras</option>
              {eras.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Confederation</span>
            <select
              value={filters.confederation}
              onChange={(event) => push({ confederation: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">All confederations</option>
              {confederations.map((confederation) => (
                <option key={confederation} value={confederation}>
                  {confederation}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Minimum rating</span>
            <select
              value={filters.minRating}
              onChange={(event) => push({ minRating: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">Any rating</option>
              {[80, 85, 88, 90, 92].map((rating) => (
                <option key={rating} value={rating}>
                  {rating}+
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Preferred foot</span>
            <select
              value={filters.foot}
              onChange={(event) => push({ foot: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">Either foot</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
            </select>
          </label>

          <label className="block">
            <span className="eyebrow">Height</span>
            <select
              value={filters.height}
              onChange={(event) => push({ height: event.target.value })}
              className="field mt-1.5"
            >
              <option value="">Any height</option>
              <option value="under170">Under 170 cm</option>
              <option value="170-179">170–179 cm</option>
              <option value="180-189">180–189 cm</option>
              <option value="190plus">190 cm and over</option>
            </select>
          </label>
        </div>
      </section>

      {/* --------------------------------------------------------------- table */}
      <section aria-label="Player table" className="mt-6">
        {filtered.length === 0 ? (
          <div className="card grid place-items-center px-6 py-20 text-center">
            <p className="display text-3xl">No players match those filters</p>
            <p className="mt-3 max-w-md text-[13px] text-muted">
              The atlas never invents a player to fill a gap. Widen a filter, clear the search, or{" "}
              <button type="button" onClick={reset} className="link-underline text-ink">
                reset everything
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            {/* desktop / tablet table */}
            <div className="hidden lg:block">
              <div className="card overflow-hidden">
                <div
                  role="row"
                  className="flex items-center gap-3 border-b border-line bg-surface-raised px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-muted"
                >
                  <span className="w-[38px]" aria-hidden="true" />
                  {SORTABLE.map((column) => {
                    const active = filters.sort === column.key;
                    return (
                      <button
                        key={column.key}
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        aria-label={`Sort by ${column.label}`}
                        aria-pressed={active}
                        className={`${column.className} flex items-center gap-1 text-left uppercase tracking-[0.12em] transition-colors duration-150 ease-out hover:text-ink ${
                          active ? "text-ink" : ""
                        } ${column.className.includes("text-right") ? "justify-end" : ""}`}
                      >
                        {column.label}
                        <span aria-hidden="true" className={active ? "text-[var(--accent-text)]" : "opacity-30"}>
                          {active ? (filters.dir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  ref={scrollerRef}
                  onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
                  className="overflow-y-auto"
                  style={{ height: Math.min(VIEWPORT, Math.max(filtered.length * ROW_HEIGHT, ROW_HEIGHT)) }}
                  tabIndex={0}
                  role="rowgroup"
                  aria-label={`Player table, ${filtered.length} rows. Use the header buttons to sort.`}
                >
                  <div style={{ height: filtered.length * ROW_HEIGHT, position: "relative" }}>
                    <div style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}>
                      {visible.map((player) => (
                        <Link
                          key={player.id}
                          href={`/players/${player.id}`}
                          style={{ height: ROW_HEIGHT }}
                          className="flex items-center gap-3 border-b border-line px-4 text-[13px] transition-colors duration-150 ease-out hover:bg-[var(--surface-raised)] focus-visible:bg-[var(--surface-raised)]"
                        >
                          <span className="w-[38px]">
                            <PlayerAvatar name={player.name} size={30} />
                          </span>
                          <span className="min-w-0 flex-[1.6]">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-semibold">{player.name}</span>
                              {player.isFictional && <FictionalBadge />}
                            </span>
                            <span className="block truncate text-[11px] text-muted">
                              {player.fullName !== player.name ? player.fullName : player.clubs[0]}
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-[1.05] items-center gap-2">
                            <Flag code={player.countryCode} label={player.nationality} size="sm" />
                            <span className="truncate text-muted">{player.nationality}</span>
                          </span>
                          <span className="w-[68px] text-muted">{player.position}</span>
                          <span className="hidden w-[104px] text-muted xl:block">{player.era}</span>
                          <span className="hidden min-w-0 flex-[1.5] truncate text-muted xl:block">
                            {player.clubs.slice(0, 2).join(", ")}
                            {player.clubs.length > 2 ? ` +${player.clubs.length - 2}` : ""}
                          </span>
                          <span className="num w-[68px] text-right">{orDash(player.careerGoals)}</span>
                          <span className="num w-[64px] text-right">{orDash(player.internationalCaps)}</span>
                          <span className="w-[62px] text-right">
                            <span className="num rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[12px] font-semibold text-[var(--accent-text)]">
                              {player.overall}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-muted">
                  <span>
                    Showing {filtered.length} players · virtualised rows ({visible.length} rendered)
                  </span>
                  <span>Ratings: estimated · {players[0]?.ratingEdition ?? "Atlas model"}</span>
                </div>
              </div>
            </div>

            {/* mobile cards */}
            <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
              {filtered.map((player) => (
                <li key={player.id}>
                  <Link href={`/players/${player.id}`} className="card card-hover flex items-center gap-3 p-3">
                    <PlayerAvatar name={player.name} size={46} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[14px] font-semibold">{player.name}</span>
                        {player.isFictional && <FictionalBadge />}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                        <Flag code={player.countryCode} label={player.nationality} size="sm" />
                        {player.nationality} · {player.position} · {player.era}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="num block text-[16px] font-semibold text-[var(--accent-text)]">
                        {player.overall}
                      </span>
                      <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                        {orDash(player.careerGoals)} gls
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
