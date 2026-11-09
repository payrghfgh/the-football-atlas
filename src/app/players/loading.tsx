export default function Loading() {
  return (
    <div className="shell pb-24 pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the player index…</span>
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton mt-4 h-14 w-2/3 rounded-lg" />
      <div className="skeleton mt-4 h-4 w-1/2 rounded" />
      <div className="skeleton mt-8 h-32 rounded-xl" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
