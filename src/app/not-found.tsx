import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell grid min-h-[62vh] place-items-center py-20 text-center">
      <div>
        <p className="display text-[clamp(6rem,18vw,12rem)] leading-none text-[var(--accent-text)]">404</p>
        <h1 className="display mt-2 text-3xl">Off the pitch</h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">
          That page is not in the atlas. It may have been a player who is not in this dataset snapshot,
          or a link that was mistyped.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/players" className="btn btn-accent">Browse players</Link>
          <Link href="/timeline" className="btn">Open the timeline</Link>
          <Link href="/search" className="btn">Search everything</Link>
        </div>
      </div>
    </div>
  );
}
