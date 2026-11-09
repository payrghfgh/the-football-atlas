import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { allClubs, allCountries, allPlayers } from "@/lib/data";

const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/players", "/countries", "/clubs", "/timeline", "/compare", "/play", "/about", "/search"];
  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
    ...allPlayers.map((player) => ({
      url: `${base}/players/${player.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...allCountries.map((country) => ({
      url: `${base}/countries/${country.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...allClubs.map((club) => ({
      url: `${base}/clubs/${club.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
