import Link from "next/link";
import { Flag } from "@/components/Flag";
import { FictionalBadge } from "@/components/FictionalBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Reveal } from "@/components/Reveal";
import { allCountries, allPlayers, allTournaments, meta } from "@/lib/data";
import { compact, number, orDash } from "@/lib/format";
import type { Player } from "@/lib/data";

function playerOfTheDay(): Player {
  const now = new Date();
  const seed = now.getUTCFullYear() * 372 + now.getUTCMonth() * 31 + now.getUTCDate();
  return allPlayers[seed % allPlayers.length];
}

function topScorers() {
  return [...allPlayers]
    .sort((a, b) => (b.careerGoals ?? 0) - (a.careerGoals ?? 0))
    .slice(0, 8);
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  pace: "PAC",
  shooting: "SHO",
  passing: "PAS",
  dribbling: "DRI",
  defending: "DEF",
  physical: "PHY",
};

export default function HomePage() {
  const featured = playerOfTheDay();
  const scorers = topScorers();
  const stats = [
    { label: "Players", value: number(meta.counts.players), note: "curated subset" },
    { label: "Nations", value: number(meta.counts.countries), note: "with a squad in the atlas" },
    { label: "World Cups", value: number(meta.counts.playedTournaments), note: "played, 1930 → 2026" },
    { label: "Clubs", value: number(meta.counts.clubs), note: "represented by those players" },
  ];
  const played = allTournaments.filter((t) => t.status === "played").reverse();
  const lastPlayed = played[0];
  const previous = played[1];

  return (
    <div>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-lines" />
        <div className="shell relative grid gap-12 pb-16 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              The encyclopedia of the game
            </p>
            <h1 className="display mt-5 text-[clamp(3.4rem,9vw,7.4rem)]">
              Every player.
              <br />
              Every nation.
              <br />
              <span className="text-[var(--accent-text)]">Every World Cup.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
              The Football Atlas indexes footballers from the first World Cup in 1930 to the
              48-team tournament of 2026 — career numbers, skill profiles, national records and
              a rating card for each one. Search it, filter it, compare it, share the link.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/players" className="btn btn-accent px-5 py-2.5">
                Browse the players
              </Link>
              <Link href="/timeline" className="btn px-5 py-2.5">
                Open the 1930–2026 timeline
              </Link>
              <Link href="/compare" className="btn px-5 py-2.5">
                Compare up to four
              </Link>
            </div>
            <p className="mt-6 text-[12px] text-muted">
              Press <kbd className="rounded border border-line px-1.5 py-0.5">/</kbd> anywhere to
              search. Data snapshot {meta.snapshotDate}.
            </p>
          </div>

          {/* featured card */}
          <div className="space-y-4">
          <Reveal className="relative">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="eyebrow">Player of the day</p>
                <span className="chip">{featured.era}</span>
              </div>
              <div className="flex items-start gap-4 px-5 pt-5">
                <PlayerAvatar name={featured.name} size={72} />
                <div className="min-w-0">
                  <h2 className="display text-3xl leading-none">
                    <Link href={`/players/${featured.id}`} className="hover:text-[var(--accent-text)]">
                      {featured.name}
                    </Link>
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                    <Flag code={featured.countryCode} label={featured.nationality} size="sm" />
                    {featured.nationality} · {featured.position} · #{featured.shirtNumber}
                    {featured.isFictional && <FictionalBadge />}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="display text-5xl leading-none text-[var(--accent-text)]">
                    {featured.overall}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted">OVR</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-6 gap-px border-y border-line bg-line text-center">
                {Object.entries(featured.attributes).map(([key, value]) => (
                  <div key={key} className="bg-surface px-1 py-3">
                    <dt className="text-[10px] tracking-[0.1em] text-muted">{ATTRIBUTE_LABELS[key]}</dt>
                    <dd className="num mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="px-5 py-4">
                <p className="text-[13px] leading-relaxed text-muted">{featured.bio}</p>
                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/players/${featured.id}`}
                    className="text-[12px] font-semibold text-[var(--accent-text)] link-underline"
                  >
                    Full profile →
                  </Link>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
                    {featured.isFictional
                      ? "Fictional · owner-supplied"
                      : `Estimated · ${featured.ratingEdition}`}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="card p-5">
            <p className="eyebrow">What&rsquo;s inside</p>
            <ul className="mt-3 grid gap-2 text-[13px]">
              {[
                { href: "/players", label: "The player index", note: "sortable, filterable, shareable" },
                { href: "/timeline", label: "The 1930–2026 timeline", note: "one node per edition" },
                { href: "/compare", label: "Compare up to four", note: "radar overlay + head to head" },
                { href: "/about", label: "Method & sources", note: "what is estimated, what is missing" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-baseline justify-between gap-3 rounded-md px-1 py-1.5 transition-colors duration-150 ease-out hover:text-[var(--accent-text)]"
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-right text-[11px] text-muted">{item.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
          </div>
        </div>

        {/* stat strip */}
        <div className="shell relative">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-t-xl border border-b-0 border-line bg-line md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-surface px-5 py-6">
                <dd className="display num text-5xl leading-none">{stat.value}</dd>
                <dt className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em]">
                  {stat.label}
                </dt>
                <p className="mt-1 text-[11px] text-muted">{stat.note}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ top scorers */}
      <section className="shell py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h2 className="display mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
              The heaviest
              <br />
              scoring records
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
              Career goals for club and country combined, as recorded in this dataset. Figures are
              editorial totals from public records — a player with no recorded total shows “—” rather
              than a guess.
            </p>
            <Link href="/players?sort=careerGoals&dir=desc" className="btn mt-6">
              Sort the full table by goals
            </Link>
          </div>

          <ol className="divide-y divide-line border-y border-line">
            {scorers.map((player, index) => (
              <li key={player.id}>
                <Link
                  href={`/players/${player.id}`}
                  className="group flex items-center gap-4 py-3.5 transition-colors duration-150 ease-out hover:bg-[var(--surface-raised)]"
                >
                  <span className="num w-6 text-right text-[12px] text-muted">{index + 1}</span>
                  <PlayerAvatar name={player.name} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold">{player.name}</span>
                      <Flag code={player.countryCode} label={player.nationality} size="sm" />
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {player.position} · {player.era} · {player.clubs[0]}
                    </span>
                  </span>
                  <span className="num text-right">
                    <span className="block text-[16px] font-semibold">{orDash(player.careerGoals)}</span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted">goals</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------------- timeline */}
      <section className="border-y border-line bg-surface">
        <div className="shell py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2 className="display mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
                Twenty-three tournaments, two cancelled years
              </h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
                From thirteen teams in Montevideo to forty-eight across North America. Each node
                holds the host, winner, final score, top scorer, Golden Ball and one moment that
                defined the edition.
              </p>
            </div>
            <Link href="/timeline" className="btn">
              Open the timeline
            </Link>
          </div>

          <div className="mt-10 -mx-5 overflow-x-auto px-5 pb-2">
            <ol className="flex min-w-max items-stretch gap-3">
              {allTournaments.map((tournament) => {
                const isGap = tournament.status === "cancelled";
                const isFuture = tournament.status === "upcoming";
                return (
                  <li key={tournament.id} className="w-[150px] shrink-0">
                    <Link
                      href={`/timeline?year=${tournament.year}`}
                      className={`card card-hover flex h-full flex-col p-3 ${
                        isGap ? "opacity-45" : ""
                      }`}
                    >
                      <span className="num text-[20px] font-semibold">{tournament.year}</span>
                      <span className="mt-1 text-[11px] text-muted">{tournament.host}</span>
                      <span className="mt-3 flex items-center gap-1.5 text-[12px] font-medium">
                        {tournament.winnerCode ? (
                          <Flag code={tournament.winnerCode} size="sm" label={tournament.winner ?? undefined} />
                        ) : null}
                        <span className={isFuture ? "text-[var(--accent-text)]" : ""}>
                          {isGap ? "Not played" : isFuture ? `${tournament.year} · upcoming` : tournament.winner}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- arcade */}
      <section className="shell py-10">
        <div className="card flex flex-wrap items-center justify-between gap-5 p-6">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Arcade
            </p>
            <p className="display mt-2 text-[clamp(1.8rem,3vw,2.6rem)] leading-none">
              Penalty shootout
            </p>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
              Five penalties against a pixel keeper. Aim for a corner, judge the power bar, and try not
              to put it over the bar. Keyboard, pointer or buttons — and it keeps your best score.
            </p>
          </div>
          <Link href="/play" className="btn btn-accent px-5 py-2.5">
            Play the game
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------------ footer CTA */}
      <section className="shell py-16 lg:py-20">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="card p-6">
            <p className="eyebrow">Last played</p>
            <p className="display mt-2 text-4xl">{lastPlayed?.year} · {lastPlayed?.host}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {lastPlayed?.finalScore}. Golden Ball: {lastPlayed?.goldenBall}.{" "}
              {lastPlayed?.totalGoals} goals in {lastPlayed?.matches} matches.
            </p>
            <Link href={`/timeline?year=${lastPlayed?.year}`} className="mt-4 inline-block text-[12px] font-semibold text-[var(--accent-text)] link-underline">
              Tournament breakdown →
            </Link>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Before that</p>
            <p className="display mt-2 text-4xl">
              {previous?.year} · {previous?.host}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              {previous?.finalScore}. Golden Ball: {previous?.goldenBall}.{" "}
              {previous?.totalGoals} goals in {previous?.matches} matches.
            </p>
            <Link href={`/timeline?year=${previous?.year}`} className="mt-4 inline-block text-[12px] font-semibold text-[var(--accent-text)] link-underline">
              Tournament breakdown →
            </Link>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Coverage</p>
            <p className="display mt-2 text-4xl">
              {allCountries.length} nations
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Six confederations, {compact(meta.counts.worldCupGoals)} World Cup goals between the
              players in this file. The defined scope is wider than what ships —{" "}
              <Link href="/about#scope" className="link-underline">read what is missing</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
