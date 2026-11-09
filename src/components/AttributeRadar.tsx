"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { Attributes } from "@/lib/data";

const ORDER: (keyof Attributes)[] = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
];

const COLORS = ["#c6f24e", "#7cc4ff", "#ff9f6e", "#e08cff"];

export function AttributeRadar({
  series,
  height = 320,
}: {
  series: { name: string; attributes: Attributes }[];
  height?: number;
}) {
  const data = ORDER.map((key) => {
    const row: Record<string, string | number> = {
      axis: key.charAt(0).toUpperCase() + key.slice(1),
    };
    series.forEach((entry) => {
      row[entry.name] = entry.attributes[key];
    });
    return row;
  });

  return (
    <div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--line-strong)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--muted)", fontSize: 11, letterSpacing: 1 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {series.map((entry, index) => (
              <Radar
                key={entry.name}
                name={entry.name}
                dataKey={entry.name}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={series.length > 1 ? 0.1 : 0.22}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {series.length > 1 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-muted">
          {series.map((entry, index) => (
            <li key={entry.name} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              {entry.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
