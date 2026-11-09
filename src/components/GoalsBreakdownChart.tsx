"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Player } from "@/lib/data";

export function GoalsBreakdownChart({ player }: { player: Player }) {
  const breakdown = player.goalsBreakdown;
  if (!breakdown) {
    return (
      <p className="text-[13px] text-muted">
        No career goal total is recorded for this player, so a breakdown cannot be estimated.
      </p>
    );
  }

  const data = [
    { label: "Open play", value: breakdown.openPlay },
    { label: "Header", value: breakdown.header },
    { label: "Penalty", value: breakdown.penalty },
    { label: "Free kick", value: breakdown.freeKick },
  ];
  const feet = [
    { label: "Left foot", value: breakdown.leftFoot },
    { label: "Right foot", value: breakdown.rightFoot },
  ];

  return (
    <div className="space-y-6">
      <div style={{ width: "100%", height: 190 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid stroke="var(--line)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={78}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 10,
                fontSize: 12,
                color: "var(--text)",
              }}
              formatter={(value: number) => [`${value} goals (estimated)`, ""]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={index === 0 ? "var(--accent)" : "var(--line-strong)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {feet.map((foot) => (
          <div key={foot.label} className="rounded-lg border border-line px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{foot.label}</p>
            <p className="num mt-1 text-lg font-semibold">{foot.value}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Estimated (Atlas model). A per-goal breakdown is not published for most careers, so these
        splits are modelled from the player&apos;s shooting, physical profile and preferred foot — they
        are not an official record.
      </p>
    </div>
  );
}
