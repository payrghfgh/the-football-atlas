"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AttributeRadar } from "@/components/AttributeRadar";
import { Flag } from "@/components/Flag";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/lib/data";
import { orDash } from "@/lib/format";

const MAX = 4;

const ROWS: { key: string; label: string; value: (player: Player) => number | string; higher: boolean }[] = [
  { key: "overall", label: "Overall", value: (p) => p.overall, higher: true },
  { key: "position", label: "Position", value: (p) => p.position, higher: false },
  { key: "nationality", label: "Nation", value: (p) => p.nationality, higher: false },
  { key: "era", label: "Era", value: (p) => p.era, higher: false },
  { key: "heightCm", label: "Height (cm)", value: (p) => p.heightCm, higher: true },
  { key: "preferredFoot", label: "Preferred foot", value: (p) => p.preferredFoot, higher: false },
  { key: "careerGoals", label: "Career goals", value: (p) => p.careerGoals ?? "—", higher: true },
  { key: "internationalGoals", label: "International goals", value: (p) => p.internationalGoals ?? "—", higher: true },
  { key: "internationalCaps", label: "Caps", value: (p) => p.internationalCaps ?? "—", higher: true },
  { key: "worldCupGoals", label: "World Cup goals", value: (p) => p.worldCupGoals ?? "—", higher: true },
  { key: "pace", label: "Pace", value: (p) => p.attributes.pace, higher: true },
  { key: "shooting", label: "Shooting", value: (p) => p.attributes.shooting, higher: true },
  { key: "passing", label: "Passing", value: (p) => p.attributes.passing, higher: true },
  { key: "dribbling", label: "Dribbling", value: (p) => p.attributes.dribbling, higher: true },
  { key: "defending", label: "Defending", value: (p) => p.attributes.defending, higher: true },
  { key: "physical", label: "Physical", value: (p) => p.attributes.physical, higher: true },
];

export function CompareTool({ players }: { players: Player[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const byId = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  const [selected, setSelected] = useState<string[]>(() => {
    const raw = searchParams.get("p") ?? "";
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter((id) => byId.has(id))
      .slice(0, MAX);
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const raw = selected.length ? `/compare?p=${selected.join(",")}` : "/compare";
    router.replace(raw, { scroll: false });
  }, [router, selected]);

  const chosen = selected.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return players
      .filter((player) => !selected.includes(player.id))
      .filter((player) => `${player.name} ${player.nationality} ${player.position}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [players, query, selected]);

  function add(id: string) {
    setSelected((current) => (current.includes(id) || current.length >= MAX ? current : [...current, id]));
    setQuery("");
  }

  function remove(id: string) {
    setSelected((current) => current.filter((entry) => entry !== id));
  }

  return (
    <div>
      {/* picker */}
      <div className="card mt-8 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="compare-search" className="eyebrow">
              Add a player ({selected.length}/{MAX})
            </label>
            <input
              id="compare-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, nation or position…"
              className="field mt-1.5"
              disabled={selected.length >= MAX}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
          >
            Copy share link
          </button>
          <button type="button" className="btn" onClick={() => setSelected([])} disabled={!selected.length}>
            Clear
          </button>
        </div>

        {suggestions.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {suggestions.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => add(player.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] hover:bg-[var(--surface-raised)]"
                >
                  <PlayerAvatar name={player.name} size={28} />
                  <span className="flex-1 truncate font-medium">{player.name}</span>
                  <span className="text-[11px] text-muted">
                    {player.position} · {player.nationality}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected.length >= MAX && (
          <p className="mt-3 text-[11px] text-muted">
            Four players is the maximum — remove one to add another.
          </p>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="card mt-6 grid place-items-center px-6 py-20 text-center">
          <p className="display text-3xl">Pick two to four players</p>
          <p className="mt-3 max-w-md text-[13px] text-muted">
            The radar overlays their six attributes; the table compares career numbers and rates the
            better value in each row. Everything is in the URL, so a comparison is a link you can send.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {players.slice(0, 3).map((player) => (
              <button key={player.id} type="button" className="btn" onClick={() => add(player.id)}>
                Try {player.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(chosen.length, 1)}, minmax(0, 1fr))` }}>
            {chosen.map((player) => (
              <div key={player.id} className="card p-3">
                <div className="flex items-start gap-2">
                  <PlayerAvatar name={player.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${player.id}`} className="block truncate text-[13px] font-semibold hover:text-[var(--accent-text)]">
                      {player.name}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                      <Flag code={player.countryCode} size="sm" />
                      {player.position}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(player.id)}
                    aria-label={`Remove ${player.name} from the comparison`}
                    className="text-[11px] text-muted hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="card p-5">
              <h2 className="display text-2xl">Attribute overlay</h2>
              <AttributeRadar
                series={chosen.map((player) => ({ name: player.name, attributes: player.attributes }))}
                height={360}
              />
              <p className="mt-2 text-[11px] text-muted">
                Estimated values from the Atlas model — not official ratings.
              </p>
            </section>

            <section className="card overflow-hidden">
              <h2 className="display border-b border-line px-5 py-4 text-2xl">Head to head</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <caption className="sr-only">Side-by-side comparison of the selected players</caption>
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-[0.1em] text-muted">
                      <th scope="col" className="px-4 py-2 font-medium">Metric</th>
                      {chosen.map((player) => (
                        <th key={player.id} scope="col" className="px-3 py-2 text-right font-medium">
                          {player.name.split(" ").slice(-1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ROWS.map((row) => {
                      const values = chosen.map((player) => row.value(player));
                      const numeric = values.filter((value): value is number => typeof value === "number");
                      const best = row.higher && numeric.length ? Math.max(...numeric) : null;
                      return (
                        <tr key={row.key}>
                          <th scope="row" className="px-4 py-2 text-left font-normal text-muted">
                            {row.label}
                          </th>
                          {values.map((value, index) => (
                            <td
                              key={`${row.key}-${chosen[index].id}`}
                              className={`num px-3 py-2 text-right ${
                                best !== null && value === best ? "font-semibold text-[var(--accent-text)]" : ""
                              }`}
                              title={value === "—" ? "not recorded" : undefined}
                            >
                              {typeof value === "number" ? orDash(value) : value}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line px-4 py-2.5 text-[11px] text-muted">
                Highest value in each row is highlighted. “—” means the figure is not recorded in this
                dataset.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
