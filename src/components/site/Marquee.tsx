export function Marquee() {
  const text = "Slow-made between Bali & France — Complimentary shipping over €150 — Fall / Winter 2026";
  return (
    <div className="bg-secondary border-b border-border overflow-hidden py-2.5">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="px-10 shrink-0 text-[0.625rem] font-medium tracking-[0.28em] uppercase text-foreground/85">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
