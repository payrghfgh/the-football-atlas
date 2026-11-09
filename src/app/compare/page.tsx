import { Suspense } from "react";
import type { Metadata } from "next";
import { CompareTool } from "@/components/CompareTool";
import { allPlayers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Compare players",
  description:
    "Put up to four footballers side by side: attribute radar overlay, career numbers and a shareable link.",
};

export default function ComparePage() {
  return (
    <div className="shell pb-24 pt-10">
      <p className="eyebrow">Compare</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,6vw,4.6rem)]">Four players, one table</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        Pick up to four players from the atlas. The radar overlays their attribute profiles and the
        table lines up career numbers. The selection lives in the URL, so the comparison can be shared
        as a link.
      </p>
      <Suspense
        fallback={
          <div className="mt-8 space-y-4">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-80 rounded-xl" />
          </div>
        }
      >
        <CompareTool players={allPlayers} />
      </Suspense>
    </div>
  );
}
