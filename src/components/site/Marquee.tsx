export function Marquee() {
  const text = "Worldwide delivery — Crafted between Bali & France — Fall / Winter 2025 — New: The Sunburn Collection";
  return (
    <div className="bg-ink text-bone py-2.5 overflow-hidden border-b border-ink/20">
      <div className="flex whitespace-nowrap animate-marquee text-eyebrow">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="px-8 shrink-0">{text}</span>
        ))}
      </div>
    </div>
  );
}
