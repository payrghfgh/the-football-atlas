import Link from "next/link";
import type { Metadata } from "next";
import { Flag } from "@/components/Flag";
import { allClubs, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Clubs",
  description:
    "Clubs represented in the Football Atlas, with the players who turned out for them and the honours on record.",
};

export default function ClubsPage() {
  const clubs = [...allClubs].sort(
    (a, b) => b.squadIds.length - a.squadIds.length || a.name.localeCompare(b.name)
  );

  return (
    <div className="shell pb-24 pt-10">
      <p className="eyebrow">Clubs</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">Where they played</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        {allClubs.length} clubs appear in the atlas because at least one player in the dataset
        represented them. Sorted by the number of atlas players.
      </p>

      <ul className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((club) => (
          <li key={club.id}>
            <Link href={`/clubs/${club.id}`} className="card card-hover flex items-center gap-3 p-3.5">
              <Flag code={club.countryCode} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{club.name}</span>
              <span className="num shrink-0 rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--accent-text)]">
                {club.squadIds.length}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[11px] text-muted">
        Snapshot {meta.snapshotDate}. Club honours are only listed where they are a matter of record;
        an empty honours list is left empty rather than filled in.
      </p>
    </div>
  );
}
