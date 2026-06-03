export function EspressoDivider({ label }: { label?: string }) {
  return (
    <div className="mx-auto flex max-w-md items-center gap-3 py-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold-soft)] to-[var(--gold)]" />
      <div
        aria-hidden
        className="h-2 w-2 rotate-45 rounded-[2px] bg-[var(--gold)] shadow-[0_0_0_3px_rgba(0,0,0,0.25)]"
      />
      {label ? (
        <div className="text-[10px] uppercase tracking-[0.35em] text-[var(--gold-soft)]">{label}</div>
      ) : null}
      <div
        aria-hidden
        className="h-2 w-2 rotate-45 rounded-[2px] bg-[var(--gold)] shadow-[0_0_0_3px_rgba(0,0,0,0.25)]"
      />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--gold-soft)] to-[var(--gold)]" />
    </div>
  );
}