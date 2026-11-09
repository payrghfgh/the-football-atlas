import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { allPlayers, meta, searchIndex } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Football Atlas — players, countries, clubs and every World Cup",
    template: "%s · The Football Atlas",
  },
  description:
    "A searchable encyclopedia of football: player profiles with skill ratings, national team records, clubs and every FIFA World Cup from 1930 to 2026.",
  openGraph: {
    title: "The Football Atlas",
    description:
      "Players, countries, clubs and every World Cup from 1930 to 2026 — one searchable atlas.",
    type: "website",
    url: siteUrl,
    siteName: "The Football Atlas",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('atlas-theme');
    if (stored === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const entries = searchIndex();
  const playerIds = allPlayers.map((player) => player.id);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader entries={entries} playerIds={playerIds} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
        <span className="sr-only">
          Dataset snapshot {meta.snapshotDate}. {meta.scope.statement}
        </span>
      </body>
    </html>
  );
}
