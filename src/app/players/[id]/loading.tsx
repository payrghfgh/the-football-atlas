export default function Loading() {
  return (
    <div className="pb-24" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the player profile…</span>
      <div className="border-b border-line bg-surface">
        <div className="shell py-10">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="mt-8 flex gap-5">
            <div className="skeleton h-26 w-26 rounded-full" style={{ height: 104, width: 104 }} />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-12 w-2/3 rounded-lg" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="shell mt-10 grid gap-6 lg:grid-cols-2">
        <div className="skeleton h-96 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    </div>
  );
}
