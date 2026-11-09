import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Reveal } from "@/components/Reveal";
import { allCountries, getCountry, playersOf } from "@/lib/data";
import { number, orDash } from "@/lib/format";

export function generateStaticParams() {
  return allCountries.map((country) => ({ id: country.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const country = getCountry(id);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} — ${country.confederation}`,
    description: `${country.name} at the World Cup: ${country.wcTitles} title${country.wcTitles === 1 ? "" : "s"}, best finish ${country.bestFinish ?? "not recorded"}. Squad profiles in the Football Atlas.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const country = getCountry(id);
  if (!country) notFound();

  const squad = playersOf(country.squadIds);
  const topScorers = playersOf(country.topScorerIds);
  const record = country.wcRecord;

  const recordRows = [
    { label: "Played", value: record?.played },
    { label: "Won", value: record?.won },
    { label: "Drawn", value: record?.drawn },
    { label: "Lost", value: record?.lost },
    { label: "Goals for", value: record?.goalsFor },
    { label: "Goals against", value: record?.goalsAgainst },
  ];

  return (
    <div className="pb-24">
      <header className="border-b border-line bg-surface">
        <div className="shell pt-8">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/countries" className="hover:text-ink">Countries</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-ink">{country.name}</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-end gap-6 pb-8 pt-6">
            <Flag code={country.code} label={country.name} size="xl" />
            <div>
              <p className="eyebrow">{country.confederation}</p>
              <h1 className="display mt-2 text-[clamp(2.6rem,7vw,4.6rem)] leading-none">
                {country.name}
              </h1>
            </div>
            <dl className="ml-auto grid grid-cols-2 gap-x-8 gap-y-3 text-[12px] sm:grid-cols-4">
              <div>
                <dt className="text-muted">World Cups won</dt>
                <dd className="display num text-3xl leading-none">{country.wcTitles}</dd>
              </div>
              <div>
                <dt className="text-muted">Editions entered to 2022</dt>
                <dd className="display num text-3xl leading-none">{orDash(country.wcAppearances)}</dd>
              </div>
              <div>
                <dt className="text-muted">FIFA ranking</dt>
                <dd className="display num text-3xl leading-none" title="not recorded">—</dd>
              </div>
              <div>
                <dt className="text-muted">Players in atlas</dt>
                <dd className="display num text-3xl leading-none">{country.squadIds.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="shell mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="card p-6">
          <h2 className="display text-2xl">World Cup record</h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">
            All-time, not in this snapshot
          </p>
          <table className="mt-4 w-full text-[13px]">
            <caption className="sr-only">All-time World Cup record for {country.name}</caption>
            <tbody className="divide-y divide-line">
              {recordRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="py-2.5 text-left font-normal text-muted">{row.label}</th>
                  <td className="num py-2.5 text-right" title={row.value === undefined ? "not recorded" : undefined}>
                    {orDash(row.value ?? null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Win/draw/loss and goals totals are not part of this dataset snapshot, so they are shown as
            “—” with a “not recorded” tooltip instead of an estimate. Best finish:{" "}
            <span className="text-ink">{country.bestFinish ?? "not recorded"}</span>.
          </p>
          {country.wcTitleYears.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {country.wcTitleYears.map((year) => (
                <li key={year}>
                  <Link href={`/timeline?year=${year}`} className="chip hover:text-ink">
                    {year} winners
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal className="card p-6" delay={0.05}>
          <h2 className="display text-2xl">Top scorers in the atlas</h2>
          <p className="mt-1 text-[12px] text-muted">
            Ranked by international goals among the players in this dataset.
          </p>
          <ol className="mt-4 divide-y divide-line">
            {topScorers.map((player, index) => (
              <li key={player.id}>
                <Link
                  href={`/players/${player.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors duration-150 ease-out hover:text-[var(--accent-text)]"
                >
                  <span className="num w-5 text-[11px] text-muted">{index + 1}</span>
                  <PlayerAvatar name={player.name} size={34} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{player.name}</span>
                  <span className="num text-[13px] font-semibold">{orDash(player.internationalGoals)}</span>
                  <span className="w-8 text-right text-[10px] uppercase tracking-[0.1em] text-muted">gls</span>
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      <section className="shell mt-12" aria-labelledby="squad">
        <div className="flex items-baseline justify-between border-b border-line pb-2">
          <h2 id="squad" className="display text-2xl">Squad in this dataset</h2>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
            {number(country.squadIds.length)} players
          </span>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {squad.map((player) => (
            <li key={player.id}>
              <Link href={`/players/${player.id}`} className="card card-hover flex items-center gap-3 p-3">
                <PlayerAvatar name={player.name} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{player.name}</span>
                  <span className="block text-[11px] text-muted">
                    {player.position} · {player.era}
                  </span>
                </span>
                <span className="num text-[14px] font-semibold text-[var(--accent-text)]">
                  {player.overall}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {squad.length === 0 && (
          <p className="mt-4 text-[13px] text-muted">
            No players from this nation are in the dataset yet — the atlas shows nothing rather than a
            placeholder squad.
          </p>
        )}
      </section>
    </div>
  );
}
