import { Suspense } from "react";
import type { Metadata } from "next";
import { PlayersExplorer } from "@/components/PlayersExplorer";
import { allCountries, allPlayers, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Players",
  description:
    "Every player in the Football Atlas: filter by nation, position, era, confederation, rating, foot and height. Sort any column.",
};

function ExplorerSkeleton() {
  return (
    <div className="shell pb-24 pt-10">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton mt-4 h-14 w-2/3 rounded-lg" />
      <div className="skeleton mt-4 h-4 w-1/2 rounded" />
      <div className="skeleton mt-8 h-28 rounded-xl" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const countries = allCountries.map((country) => ({ id: country.id, name: country.name }));
  return (
    <Suspense fallback={<ExplorerSkeleton />}>
      <PlayersExplorer
        players={allPlayers}
        countries={countries}
        eras={meta.eras}
        confederations={meta.confederations}
        total={meta.counts.players}
      />
    </Suspense>
  );
}
