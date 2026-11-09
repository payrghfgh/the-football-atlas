"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Flag } from "@/components/Flag";
import type { Tournament } from "@/lib/data";
import { number, orDash } from "@/lib/format";

export function TimelineExplorer({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = Number(searchParams.get("year"));
  const selected =
    tournaments.find((tournament) => tournament.year === requested) ??
    [...tournaments].reverse().find((tournament) => tournament.status === "played") ??
    tournaments[0];

  const railRef = useRef<HTMLOListElement>(null);

  const select = useCallback(
    (year: number) => {
      router.replace(`/timeline?year=${year}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const node = railRef.current?.querySelector<HTMLElement>(`[data-year="${selected.year}"]`);
    node?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selected.year]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = tournaments.findIndex((tournament) => tournament.year === selected.year);
    const next = event.key === "ArrowRight" ? index + 1 : index - 1;
    const target = tournaments[next];
    if (target) select(target.year);
  }

  const isGap = selected.status === "cancelled";
  const isFuture = selected.status === "upcoming";

  return (
    <div>
      {/* ---------------------------------------------------------------- rail */}
      <div className="relative mt-10">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[52px] h-px bg-line"
        />
        <ol
          ref={railRef}
          onKeyDown={onKeyDown}
          tabIndex={0}
          aria-label="World Cup editions, 1930 to 2026. Use the arrow keys to move between editions."
          className="relative flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 pt-1"
        >
          {tournaments.map((tournament) => {
            const active = tournament.year === selected.year;
            const gap = tournament.status === "cancelled";
            const future = tournament.status === "upcoming";
            return (
              <li key={tournament.id} className="snap-center">
                <button
                  type="button"
                  data-year={tournament.year}
                  onClick={() => select(tournament.year)}
                  aria-pressed={active}
                  className={`group flex w-[104px] flex-col items-center rounded-xl border px-2 pb-3 pt-2 transition-colors duration-150 ease-out ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-transparent hover:border-line hover:bg-[var(--surface-raised)]"
                  } ${gap ? "opacity-45" : ""}`}
                >
                  <span className={`num text-[15px] font-semibold ${active ? "text-[var(--accent-text)]" : ""}`}>
                    {tournament.year}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-2 mb-2 h-3 w-3 rounded-full border-2 ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)]"
                        : gap
                        ? "border-[var(--line-strong)] bg-transparent"
                        : "border-[var(--line-strong)] bg-[var(--bg)] group-hover:border-[var(--accent)]"
                    }`}
                  />
                  <span className="flex h-4 items-center gap-1 text-[10px] text-muted">
                    {tournament.winnerCode ? (
                      <Flag code={tournament.winnerCode} size="sm" label={tournament.winner ?? undefined} />
                    ) : gap ? (
                      "—"
                    ) : future ? (
                      "2026"
                    ) : null}
                  </span>
                  <span className="mt-1 line-clamp-2 text-center text-[10px] leading-tight text-muted">
                    {gap ? "cancelled" : tournament.host}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* -------------------------------------------------------------- detail */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section
          key={selected.year}
          className="card animate-rise p-6"
          aria-live="polite"
          aria-label={`${selected.year} World Cup details`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                {isGap ? "Not played" : isFuture ? "Upcoming · no result in snapshot" : "FIFA World Cup"}
              </p>
              <h2 className="display mt-2 text-[clamp(2.4rem,5vw,3.6rem)] leading-none">
                {selected.year}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                {selected.hostCodes.map((code) => (
                  <Flag key={code} code={code} size="sm" />
                ))}
                {selected.host}
              </p>
            </div>
            {selected.winnerCode && (
              <div className="text-right">
                <p className="eyebrow">Winner</p>
                <p className="display mt-1 text-2xl leading-none">{selected.winner}</p>
                <p className="mt-1 text-[11px] text-muted">vs {selected.runnerUp}</p>
              </div>
            )}
          </div>

          {selected.finalScore && (
            <p className="mt-5 rounded-lg border border-line bg-[var(--surface-raised)] px-4 py-3 text-[13px]">
              <span className="text-muted">Final · </span>
              {selected.finalScore}
            </p>
          )}

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              { label: "Teams", value: orDash(selected.teams) },
              { label: "Matches", value: orDash(selected.matches) },
              { label: "Goals", value: orDash(selected.totalGoals) },
              {
                label: "Attendance",
                value: selected.attendance ? number(selected.attendance) : "—",
                note: selected.attendance ? undefined : "not recorded",
              },
              { label: "Top scorer", value: selected.topScorer ?? "—" },
              { label: "Golden Ball", value: selected.goldenBall ?? "—", note: selected.goldenBall ? undefined : "award from 1982" },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface px-4 py-3">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  {stat.label}
                  {stat.note && <span title={stat.note}> · {stat.note}</span>}
                </dt>
                <dd className="mt-1 text-[14px] font-semibold">
                  {stat.label === "Top scorer" && selected.topScorerGoals
                    ? `${stat.value} · ${selected.topScorerGoals} goals`
                    : stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <p className="eyebrow">The moment</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{selected.moment}</p>
          </div>
        </section>

        {/* context column */}
        <div className="space-y-4">
          <section className="card p-6">
            <h2 className="display text-2xl">Reading the node</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {isGap
                ? "1942 and 1946 are shown as gaps rather than skipped: the Second World War stopped both editions, so the atlas keeps the empty years on the line."
                : isFuture
                ? "This edition has not been played yet in the atlas's record. The format is known, but no winner, scorer or attendance is shown, and none will be invented."
                : "Every figure on this node is a published tournament record. Where a value is missing it reads “—” with a “not recorded” tooltip."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const index = tournaments.findIndex((t) => t.year === selected.year);
                  const previous = tournaments[index - 1];
                  if (previous) select(previous.year);
                }}
                disabled={tournaments[0].year === selected.year}
              >
                ← Earlier
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const index = tournaments.findIndex((t) => t.year === selected.year);
                  const next = tournaments[index + 1];
                  if (next) select(next.year);
                }}
                disabled={tournaments[tournaments.length - 1].year === selected.year}
              >
                Later →
              </button>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="display text-2xl">Editions at a glance</h2>
            <ul className="mt-3 max-h-[260px] space-y-1 overflow-y-auto pr-1 text-[12px]">
              {tournaments.map((tournament) => (
                <li key={tournament.id}>
                  <button
                    type="button"
                    onClick={() => select(tournament.year)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors duration-150 ease-out hover:bg-[var(--surface-raised)] ${
                      tournament.year === selected.year ? "bg-[var(--accent-soft)]" : ""
                    }`}
                  >
                    <span className="num w-10 text-muted">{tournament.year}</span>
                    <span className="flex-1 truncate">
                      {tournament.status === "cancelled"
                        ? "Cancelled"
                        : tournament.status === "upcoming"
                        ? `${tournament.host} · upcoming`
                        : `${tournament.winner} · ${tournament.host}`}
                    </span>
                    {tournament.winnerCode && <Flag code={tournament.winnerCode} size="sm" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
