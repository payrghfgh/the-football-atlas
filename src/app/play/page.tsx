import Link from "next/link";
import type { Metadata } from "next";
import { PenaltyGame } from "@/components/PenaltyGame";

export const metadata: Metadata = {
  title: "Penalty shootout",
  description:
    "A pixel-art penalty shootout: aim, hold your nerve on the power bar and beat the keeper five times. Playable with keyboard, pointer or buttons.",
};

export default function PlayPage() {
  return (
    <div className="shell max-w-4xl pb-24 pt-10">
      <p className="eyebrow">Arcade</p>
      <h1 className="display mt-3 text-[clamp(2.6rem,7vw,4.6rem)]">Penalty shootout</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        Five penalties, one keeper, a power bar with no patience. Place the reticle anywhere in the
        goal mouth, lock it, then judge the bar as it swings — too hard and the ball climbs over the
        crossbar. Drawn on a 320×200 canvas and scaled up pixel for pixel: tiered crowd, floodlights,
        a net with depth, a keeper who dives in three frames and a striker who follows through.
      </p>

      <div className="mt-8">
        <PenaltyGame />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="eyebrow">Aim</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Anywhere in the goal mouth, not a fixed grid. Arrows or WASD move the reticle (Shift for
            fine aim), the pointer aims on move and locks on click.
          </p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">Power</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            The bar sweeps back and forth. Past 94% the shot rises over the bar; below 20% it is slow
            enough for the keeper to reach. The sweet spot is high, not maximum.
          </p>
        </div>
        <div className="card p-5">
          <p className="eyebrow">Pressure</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            The keeper dives for the ball, not for a zone: placement is measured against his hands, and
            he reads you better each round. Three difficulties, best score kept on this device.
          </p>
        </div>
      </div>

      <p className="mt-8 text-[13px] text-muted">
        Keyboard, pointer and the buttons all play the same game; every shot is announced through a
        live region for screen readers, and the ball animation is skipped when your device asks for
        reduced motion. Back to the{" "}
        <Link href="/players" className="link-underline text-ink">
          player index
        </Link>{" "}
        or the{" "}
        <Link href="/timeline" className="link-underline text-ink">
          1930–2026 timeline
        </Link>
        .
      </p>
    </div>
  );
}
