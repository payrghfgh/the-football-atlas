import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { Reveal } from "@/components/Reveal";
import { allClubs, getClub, playersOf } from "@/lib/data";

export function generateStaticParams() {
  return allClubs.map((club) => ({ id: club.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const club = getClub(id);
  if (!club) return { title: "Club not found" };
  return {
    title: club.name,
    description: `${club.name} in the Football Atlas: ${club.squadIds.length} players and the honours on record.`,
  };
}

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = getClub(id);
  if (!club) notFound();

  const squad = playersOf(club.squadIds);
  const byEra = new Map<string, typeof squad>();
  for (const player of squad) {
    const list = byEra.get(player.era) ?? [];
    list.push(player);
    byEra.set(player.era, list);
  }

  return (
    <div className="pb-24">
      <header className="border-b border-line bg-surface">
        <div className="shell pt-8">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/clubs" className="hover:text-ink">Clubs</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-ink">{club.name}</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-4 pb-8 pt-6">
            <Flag code={club.countryCode} size="xl" />
            <div>
              <p className="eyebrow">Club</p>
              <h1 className="display mt-1 text-[clamp(2.4rem,6vw,4.2rem)] leading-none">{club.name}</h1>
            </div>
            <p className="ml-auto text-[12px] text-muted">
              {club.squadIds.length} player{club.squadIds.length === 1 ? "" : "s"} in the atlas
            </p>
          </div>
        </div>
      </header>

      <div className="shell mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="card p-6">
          <h2 className="display text-2xl">Honours on record</h2>
          {club.honours.length > 0 ? (
            <ul className="mt-3 space-y-2 text-[13px]">
              {club.honours.map((honour) => (
                <li key={honour} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                  {honour}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] text-muted">
              No honours are recorded for this club in the snapshot. The atlas does not fill that gap
              with an estimate.
            </p>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Domestic title counts vary by source and are deliberately not listed here; the European
            Cup / Champions League total is a matter of record.
          </p>
        </Reveal>

        <Reveal className="card p-6" delay={0.05}>
          <h2 className="display text-2xl">Squad by era</h2>
          <div className="mt-3 space-y-5">
            {[...byEra.entries()].map(([era, players]) => (
              <div key={era}>
                <p className="eyebrow">{era}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {players.map((player) => (
                    <li key={player.id}>
                      <Link
                        href={`/players/${player.id}`}
                        className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-[12px] transition-colors duration-150 ease-out hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised)]"
                      >
                        <PlayerAvatar name={player.name} size={24} />
                        <span className="font-medium">{player.name}</span>
                        <span className="text-muted">{player.position}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
