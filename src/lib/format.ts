export const DASH = "—";

export function orDash(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return DASH;
  return String(value);
}

export function number(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  // International grouping: these are global sports records (attendance, counts).
  return new Intl.NumberFormat("en-GB").format(value);
}

export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export function age(dob: string): number | null {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function decadeOf(dob: string): string {
  const year = Number(dob.slice(0, 4));
  if (!year) return DASH;
  return `${Math.floor(year / 10) * 10}s`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic hue from a string, used for the monogram avatars. */
export function hueOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return hash;
}

export function ratingTone(overall: number): "elite" | "high" | "solid" {
  if (overall >= 90) return "elite";
  if (overall >= 85) return "high";
  return "solid";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
