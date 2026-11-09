import { Suspense } from "react";
import type { Metadata } from "next";
import { TimelineExplorer } from "@/components/TimelineExplorer";
import { allTournaments, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Timeline 1930–2026",
  description:
    "Every FIFA World Cup from 1930 to 2026: host, winner, final score, top scorer, Golden Ball, teams, goals, attendance and the moment that defined each edition.",
};

export default function TimelinePage() {
  return (
    <div className="shell pb-24 pt-10">
      <p className="eyebrow">Timeline</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">1930 → 2026</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        {meta.counts.playedTournaments} tournaments played, two cancelled for the Second World War.
        Pick a node to open its record. Data snapshot {meta.snapshotDate}.
      </p>
      <Suspense
        fallback={
          <div className="mt-10 space-y-4">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-72 rounded-xl" />
          </div>
        }
      >
        <TimelineExplorer tournaments={allTournaments} />
      </Suspense>
    </div>
  );
}
