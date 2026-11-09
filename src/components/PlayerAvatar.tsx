import { initials, hueOf } from "@/lib/format";

/**
 * Photographs are not shipped with this dataset (photoUrl is null for every
 * player), so the atlas renders a deterministic monogram instead of pretending
 * to have a portrait. The alt text says exactly that.
 */
export function PlayerAvatar({
  name,
  size = 56,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const hue = hueOf(name);
  return (
    <span
      role="img"
      aria-label={`${name} — no photograph in this dataset, monogram shown instead`}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full border border-line ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, hsl(${hue} 34% 22%), hsl(${(hue + 40) % 360} 30% 12%))`,
        fontSize: size * 0.34,
      }}
    >
      <span
        aria-hidden="true"
        className="font-semibold tracking-tight text-white/85"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {initials(name)}
      </span>
    </span>
  );
}
