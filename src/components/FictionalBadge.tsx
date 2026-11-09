/**
 * Marks a record that was not drawn from any football record. Shown wherever a
 * fictional player appears so the atlas never implies a real career.
 */
export function FictionalBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--accent)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)] ${className}`}
      title="Fictional record — supplied by the site owner, not a real player"
    >
      <span aria-hidden="true">◆</span> Fictional
    </span>
  );
}
