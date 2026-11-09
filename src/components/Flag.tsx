"use client";

import type { ComponentType } from "react";
import {
  AE,
  AR,
  AT,
  BE,
  BG,
  BR,
  CA,
  CH,
  CI,
  CL,
  CM,
  CO,
  CZ,
  DE,
  DK,
  EG,
  ES,
  FR,
  GB,
  GR,
  HR,
  HU,
  IE,
  IN,
  IT,
  JP,
  KR,
  LR,
  MX,
  MZ,
  NL,
  NO,
  PL,
  PT,
  QA,
  RU,
  SA,
  SE,
  SN,
  TR,
  UA,
  US,
  UY,
  ZA,
} from "country-flag-icons/react/3x2";

// The flag package types its components against a mixed HTML/SVG element, so
// the map is intentionally loosely typed here.
type FlagComponent = ComponentType<Record<string, unknown>>;

/**
 * Country flags come from a vector icon set (country-flag-icons), never emoji.
 * Unknown codes fall back to a neutral placeholder rather than guessing.
 */
const FLAGS: Record<string, FlagComponent> = {
  AE,
  AR,
  AT,
  BE,
  BG,
  BR,
  CA,
  CH,
  CI,
  CL,
  CM,
  CO,
  CZ,
  DE,
  DK,
  EG,
  ES,
  FR,
  GB,
  GR,
  HR,
  HU,
  IE,
  IN,
  IT,
  JP,
  KR,
  LR,
  MX,
  MZ,
  NL,
  NO,
  PL,
  PT,
  QA,
  RU,
  SA,
  SE,
  SN,
  TR,
  UA,
  US,
  UY,
  ZA,
};

export function Flag({
  code,
  label,
  className = "",
  size = "md",
}: {
  code?: string | null;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const FlagIcon = code ? FLAGS[code.toUpperCase()] : undefined;
  const name = label ? `${label} flag` : code ? `${code} flag` : "Country flag not recorded";
  const box =
    size === "sm"
      ? "h-3 w-[18px]"
      : size === "xl"
      ? "h-9 w-[54px]"
      : size === "lg"
      ? "h-5 w-[30px]"
      : "h-4 w-6";

  if (!FlagIcon) {
    return (
      <span
        role="img"
        aria-label={name}
        title={name}
        className={`inline-block ${box} shrink-0 rounded-[2px] border border-line bg-surface-raised ${className}`}
      />
    );
  }

  return (
    <span role="img" aria-label={name} title={name} className={`inline-flex shrink-0 ${className}`}>
      <FlagIcon aria-hidden="true" focusable="false" className={`${box} rounded-[2px] object-cover`} />
    </span>
  );
}
