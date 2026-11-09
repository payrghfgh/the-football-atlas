import Link from "next/link";
import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { Reveal } from "@/components/Reveal";
import { allCountries, allPlayers, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Countries",
  description:
    "Every nation in the Football Atlas: confederation, World Cup record, best finish and the players in the dataset.",
};

export default function CountriesPage() {
  const groups = new Map<string, typeof allCountries>();
  for (const country of allCountries) {
    const list = groups.get(country.confederation) ?? [];
    list.push(country);
    groups.set(country.confederation, list);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="shell pb-24 pt-10">
      <p className="eyebrow">Countries</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">Nations of the atlas</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        {allCountries.length} nations across six confederations, covering{" "}
        {allPlayers.length} players in this snapshot. FIFA world ranking and full World Cup
        win/draw/loss records are not in this dataset — those cells read “—” rather than a guess.
      </p>

      <div className="mt-10 space-y-12">
        {ordered.map(([confederation, countries]) => (
          <section key={confederation} aria-labelledby={`conf-${confederation}`}>
            <div className="flex items-baseline gap-3 border-b border-line pb-2">
              <h2 id={`conf-${confederation}`} className="display text-2xl">
                {confederation}
              </h2>
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
                {countries.length} nations
              </span>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {countries.map((country) => (
                <li key={country.id}>
                  <Link
                    href={`/countries/${country.id}`}
                    className="card card-hover flex h-full flex-col p-4"
                  >
                    <span className="flex items-center gap-2.5">
                      <Flag code={country.code} label={country.name} size="lg" />
                      <span className="display text-xl leading-none">{country.name}</span>
                    </span>
                    <span className="mt-3 flex items-baseline gap-2">
                      <span className="display num text-3xl leading-none text-[var(--accent-text)]">
                        {country.wcTitles}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
                        World Cup{country.wcTitles === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {country.bestFinish ?? "Best finish not recorded"}
                    </span>
                    <span className="mt-auto pt-3 text-[11px] text-muted">
                      {country.squadIds.length} player{country.squadIds.length === 1 ? "" : "s"} in
                      the atlas
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <Reveal className="card mt-12 p-5">
        <p className="text-[12px] leading-relaxed text-muted">
          Snapshot {meta.snapshotDate}. A nation appears here when at least one of its players is in
          the dataset — the list is not a full FIFA membership register.
        </p>
      </Reveal>
    </div>
  );
}
