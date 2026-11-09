import Link from "next/link";
import { meta } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="display text-2xl">
            Football <span className="text-[var(--accent-text)]">Atlas</span>
          </p>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
            One searchable encyclopedia of the game: {meta.counts.players} players,{" "}
            {meta.counts.countries} nations, {meta.counts.tournaments} World Cup editions.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted">
            Data snapshot {meta.snapshotDate}
          </p>
        </div>
        <nav aria-label="Browse" className="text-[13px]">
          <p className="eyebrow mb-3">Browse</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="link-underline" href="/players">Players</Link></li>
            <li><Link className="link-underline" href="/countries">Countries</Link></li>
            <li><Link className="link-underline" href="/clubs">Clubs</Link></li>
            <li><Link className="link-underline" href="/timeline">Timeline 1930–2026</Link></li>
          </ul>
        </nav>
        <nav aria-label="Tools" className="text-[13px]">
          <p className="eyebrow mb-3">Tools</p>
          <ul className="space-y-2 text-muted">
            <li><Link className="link-underline" href="/compare">Compare players</Link></li>
            <li><Link className="link-underline" href="/play">Penalty shootout game</Link></li>
            <li><Link className="link-underline" href="/search">Search</Link></li>
            <li><Link className="link-underline" href="/about">About &amp; sources</Link></li>
            <li><Link className="link-underline" href="/about#methodology">Rating methodology</Link></li>
          </ul>
        </nav>
        <div className="text-[13px]">
          <p className="eyebrow mb-3">Honesty</p>
          <p className="text-muted leading-relaxed">
            Unrecorded values show “—” with a tooltip. Attribute ratings are the Atlas model’s
            estimate unless a licensed feed is attached.
          </p>
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-line py-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Built with Next.js. No paid APIs, no tracking.</span>
        <span>Football records compiled from FIFA, RSSSF and national federation archives.</span>
      </div>
    </footer>
  );
}
