"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Flag } from "@/components/Flag";
import type { Player } from "@/lib/data";

const LABELS: Record<string, string> = {
  pace: "PAC",
  shooting: "SHO",
  passing: "PAS",
  dribbling: "DRI",
  defending: "DEF",
  physical: "PHY",
};

/** EA-FC-style rating card. Every number is labelled with its source. */
export function RatingCard({ player }: { player: Player }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  const exportPng = useCallback(async () => {
    if (!cardRef.current) return;
    setStatus("working");
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#0B0E11",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `${player.id}-atlas-card.png`;
      link.href = dataUrl;
      link.click();
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [player.id]);

  return (
    <div>
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-line"
        style={{
          background:
            "linear-gradient(155deg, #14191f 0%, #0d1116 55%, #0b0e11 100%)",
          color: "#f1f4f2",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(198,242,78,0.18), transparent 70%)" }}
        />
        <div className="relative flex items-start gap-4 p-5">
          <div className="text-center">
            <p className="num text-[44px] font-semibold leading-none text-[#c6f24e]">{player.overall}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
              {player.position}
            </p>
            <div className="mt-3 space-y-1 text-[10px] uppercase tracking-[0.1em] text-white/45">
              <p>SM {player.skillMoves}★</p>
              <p>WF {player.weakFoot}★</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-semibold leading-tight">{player.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/55">
              <Flag code={player.countryCode} label={player.nationality} size="sm" />
              {player.nationality} · {player.clubs[0]}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1.5">
              {Object.entries(player.attributes).map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-1.5">
                  <dt className="w-8 text-[9px] uppercase tracking-[0.08em] text-white/40">
                    {LABELS[key]}
                  </dt>
                  <dd className="num text-[13px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-2 border-t border-white/10 px-5 py-2.5">
          <span className="text-[9px] uppercase tracking-[0.14em] text-white/45">
            {player.isFictional ? "Fictional · owner-supplied" : `Estimated · ${player.ratingEdition}`}
          </span>
          <span className="text-[9px] uppercase tracking-[0.14em] text-white/45">
            thefootballatlas
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] leading-snug text-muted">
          {player.isFictional
            ? "Fictional record supplied by the atlas owner — not a real player, and not an official rating."
            : "Not an official EA rating. The Atlas model derives these values from position, era and recorded output."}{" "}
          <Link href="/about#methodology" className="link-underline">
            Methodology
          </Link>
          .
        </p>
        <button type="button" onClick={exportPng} className="btn shrink-0" disabled={status === "working"}>
          {status === "working" ? "Rendering…" : status === "done" ? "Saved" : status === "error" ? "Failed" : "Export PNG"}
        </button>
      </div>
    </div>
  );
}
