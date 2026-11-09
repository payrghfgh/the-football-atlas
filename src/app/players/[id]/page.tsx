import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AttributeRadar } from "@/components/AttributeRadar";
import { Flag } from "@/components/Flag";
import { FictionalBadge } from "@/components/FictionalBadge";
import { GoalsBreakdownChart } from "@/components/GoalsBreakdownChart";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RatingCard } from "@/components/RatingCard";
import { Reveal } from "@/components/Reveal";
import { allPlayers, getCountry, getPlayer, meta, similarPlayers } from "@/lib/data";
import { age, formatDate, orDash } from "@/lib/format";

export function generateStaticParams() {
  return allPlayers.map((player) => ({ id: player.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) return { title: "Player not found" };
  return {
    title: `${player.name} — ${player.position}, ${player.nationality}`,
    description: player.bio.slice(0, 155),
  };
}

const LABEL_MAP = {
  pace: "Pace",
  shooting: "Shooting",
  passing: "Passing",
  dribbling: "Dribbling",
  defending: "Defending",
  physical: "Physical",
} as const;

const ATTRIBUTE_LABELS = (Object.keys(LABEL_MAP) as (keyof typeof LABEL_MAP)[]).map((key) => ({
  key,
  label: LABEL_MAP[key],
}));

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const country = getCountry(player.nationality.toLowerCase().replace(/\s+/g, "-"));
  const similar = similarPlayers(player, 4);
  const yearsOld = age(player.dateOfBirth);

  return (
    <article className="pb-24">
      {/* -------------------------------------------------------------- header */}
      <header className="border-b border-line bg-surface">
        <div className="shell pt-8">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/players" className="hover:text-ink">Players</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-ink">{player.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 pb-10 pt-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
            <div className="flex flex-wrap items-start gap-5">
              <PlayerAvatar name={player.name} size={104} />
              <div className="min-w-0">
                <p className="eyebrow flex flex-wrap items-center gap-2">
                  <Flag code={player.countryCode} label={player.nationality} size="sm" />
                  {player.nationality} · {player.confederation} · {player.era}
                  {player.isFictional && <FictionalBadge />}
                </p>
                <h1 className="display mt-2 text-[clamp(2.6rem,7vw,4.8rem)] leading-[0.9]">
                  {player.name}
                </h1>
                <p className="mt-2 text-[13px] text-muted">{player.fullName}</p>

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-3">
                  <div>
                    <dt className="text-muted">Position</dt>
                    <dd className="font-medium">
                      {player.position}
                      {player.secondaryPositions.length > 0 && (
                        <span className="text-muted"> · {player.secondaryPositions.join(", ")}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Born</dt>
                    <dd className="font-medium">
                      {formatDate(player.dateOfBirth)}{" "}
                      <span className="text-muted">({yearsOld} today)</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Height</dt>
                    <dd className="num font-medium">{player.heightCm} cm</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Preferred foot</dt>
                    <dd className="font-medium">{player.preferredFoot}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Shirt</dt>
                    <dd className="num font-medium">#{player.shirtNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Work rate</dt>
                    <dd className="font-medium">{player.workRate}</dd>
                  </div>
                </dl>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {player.clubs.map((club) => (
                    <li key={club} className="chip">
                      {club}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <RatingCard player={player} />
            </div>
          </div>
        </div>
      </header>

      {player.isFictional && (
        <div className="shell pt-8">
          <p className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-[12px] leading-relaxed">
            <strong className="font-semibold">This is a fictional entry.</strong>{" "}
            {player.fullName} does not exist as a real footballer. Every figure on this page — the
            99 overall, the 108 career goals, the ten elasticos — was supplied by the atlas owner for
            demonstration. It is not drawn from, and makes no claim about, any real player or record.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- numbers */}
      <section className="shell pt-10">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-5">
          {[
            { label: "Career goals", value: orDash(player.careerGoals) },
            { label: "Assists", value: orDash(player.careerAssists), note: "not recorded" },
            { label: "Caps", value: orDash(player.internationalCaps) },
            { label: "International goals", value: orDash(player.internationalGoals) },
            { label: "World Cup goals", value: orDash(player.worldCupGoals) },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface px-4 py-5">
              <dd className="display num text-4xl leading-none">{stat.value}</dd>
              <dt className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted">
                {stat.label}
                {stat.note && <span title="not recorded"> · {stat.note}</span>}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="shell mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ------------------------------------------------------------ radar */}
        <Reveal className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl">Attribute profile</h2>
            <span
              className="chip"
              title={
                player.isFictional
                  ? "Fictional record — supplied by the atlas owner"
                  : "These values are generated by the Atlas model, not an official rating"
              }
            >
              {player.isFictional ? "Fictional · owner-supplied" : `Estimated · ${player.ratingEdition}`}
            </span>
          </div>
          <div className="mt-2">
            <AttributeRadar series={[{ name: player.name, attributes: player.attributes }]} height={300} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
            {ATTRIBUTE_LABELS.map(({ key, label }) => (
              <div key={key}>
                <div className="flex items-baseline justify-between text-[11px]">
                  <dt className="text-muted">{label}</dt>
                  <dd className="num font-semibold">{player.attributes[key]}</dd>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--surface-raised)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${player.attributes[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {player.playStyles.map((style) => (
              <span key={style} className="chip">{style}</span>
            ))}
            {player.signatureSkill && (
              <span className="chip border-[var(--accent)] text-[var(--accent-text)]">
                {player.signatureSkill.name} ×{player.signatureSkill.count}
              </span>
            )}
          </div>
        </Reveal>

        {/* ------------------------------------------------------------- bio */}
        <Reveal className="card p-6" delay={0.05}>
          <h2 className="display text-2xl">Profile</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">{player.bio}</p>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            {player.dataNote}{" "}
            {!player.isFictional &&
              "Career totals were recorded before the 2026 World Cup, so individual 2026 tallies are not folded in. "}
            Snapshot {meta.snapshotDate}. Sources and the rating method are on the{" "}
            <Link href="/about" className="link-underline">About page</Link>.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/compare?p=${player.id}`} className="btn btn-accent">
              Compare this player
            </Link>
            {country && (
              <Link href={`/countries/${country.id}`} className="btn">
                {player.nationality} profile
              </Link>
            )}
          </div>
        </Reveal>
      </div>

      {/* ----------------------------------------------------- career + honours */}
      <div className="shell mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="card overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-line px-6 py-4">
            <h2 className="display text-2xl">Career by club</h2>
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
              appearance totals not in snapshot
            </span>
          </div>
          <table className="w-full text-[13px]">
            <caption className="sr-only">
              Clubs represented by {player.name}, with appearance and goal totals where recorded
            </caption>
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-muted">
                <th scope="col" className="px-6 py-2 font-medium">Club</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Apps</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Goals</th>
                <th scope="col" className="px-6 py-2 text-right font-medium">Honours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {player.clubs.map((club) => (
                <tr key={club}>
                  <th scope="row" className="px-6 py-3 text-left font-medium">{club}</th>
                  <td className="num px-3 py-3 text-right text-muted" title="not recorded">—</td>
                  <td className="num px-3 py-3 text-right text-muted" title="not recorded">—</td>
                  <td className="px-6 py-3 text-right text-muted" title="not recorded">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-6 py-3 text-[11px] leading-relaxed text-muted">
            Season-by-season and per-club appearance records are not part of this dataset snapshot, so
            every cell shows “—” instead of a guess. The schema supports them — see{" "}
            <span className="text-ink">README › Extending the dataset</span>.
          </p>
        </Reveal>

        <Reveal className="space-y-6" delay={0.05}>
          <div className="card p-6">
            <h2 className="display text-2xl">Honours</h2>
            {player.honours.length === 0 && (
              <p className="mt-3 text-[13px] text-muted">
                No honours are recorded for this player. The atlas leaves the list empty rather than
                inventing one.
              </p>
            )}
            <ul className="mt-3 space-y-2 text-[13px]">
              {player.honours.map((honour) => (
                <li key={honour} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  <span>{honour}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="display text-2xl">International record</h2>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <dt className="text-muted">Caps</dt>
                <dd className="num text-lg font-semibold">{orDash(player.internationalCaps)}</dd>
              </div>
              <div>
                <dt className="text-muted">Goals</dt>
                <dd className="num text-lg font-semibold">{orDash(player.internationalGoals)}</dd>
              </div>
              <div>
                <dt className="text-muted">World Cup apps</dt>
                <dd className="num text-lg font-semibold">{orDash(player.worldCupAppearances)}</dd>
              </div>
              <div>
                <dt className="text-muted">World Cup goals</dt>
                <dd className="num text-lg font-semibold">{orDash(player.worldCupGoals)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              Tournament-by-tournament appearance lists are not in this snapshot. National team totals
              follow public federation records.
            </p>
          </div>
        </Reveal>
      </div>

      {/* ------------------------------------------------------ goals breakdown */}
      <section className="shell mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal className="card p-6">
          <h2 className="display text-2xl">How the goals were scored</h2>
          <p className="mb-4 mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
            Estimated (Atlas model)
          </p>
          <GoalsBreakdownChart player={player} />
        </Reveal>

        <Reveal className="card p-6" delay={0.05}>
          <h2 className="display text-2xl">Similar players</h2>
          <p className="mt-1 text-[12px] text-muted">
            Nearest profiles by attribute distance and position.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {similar.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/players/${other.id}`}
                  className="flex items-center gap-3 rounded-lg border border-line p-2.5 transition-colors duration-150 ease-out hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised)]"
                >
                  <PlayerAvatar name={other.name} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{other.name}</span>
                    <span className="block text-[11px] text-muted">
                      {other.position} · {other.nationality}
                    </span>
                  </span>
                  <span className="num text-[13px] font-semibold text-[var(--accent-text)]">
                    {other.overall}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </article>
  );
}
