import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";
import { searchIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every player, nation, club and World Cup edition in the Football Atlas.",
};

export default function SearchPage() {
  return (
    <div className="shell max-w-3xl pb-24 pt-10">
      <p className="eyebrow">Search</p>
      <h1 className="display mt-3 text-[clamp(2.4rem,6vw,4rem)]">Find anything</h1>
      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted">
        The same index as the global palette — press <kbd className="rounded border border-line px-1.5 py-0.5">/</kbd>{" "}
        anywhere for instant results without leaving the page.
      </p>
      <div className="mt-8">
        <SearchClient entries={searchIndex()} />
      </div>
    </div>
  );
}
