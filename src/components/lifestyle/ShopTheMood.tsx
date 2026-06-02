import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { SHOP_THE_MOOD, type MoodHotspot } from "@/data/lifestyle-content";
import { Reveal } from "@/components/lifestyle/Reveal";

function HotspotLink({
  spot,
  className,
  children,
}: {
  spot: MoodHotspot;
  className: string;
  children: ReactNode;
}) {
  if (spot.productSlug) {
    return (
      <Link to="/product/$slug" params={{ slug: spot.productSlug }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/collection" search={spot.collectionSearch ?? {}} className={className}>
      {children}
    </Link>
  );
}

function Hotspot({
  spot,
  active,
  onActivate,
}: {
  spot: MoodHotspot;
  active: boolean;
  onActivate: () => void;
}) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: "translate(-50%, -50%)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onActivate}
        onMouseEnter={onActivate}
        className="group/hot relative flex items-center justify-center size-8"
        aria-label={spot.label}
        aria-expanded={active}
      >
        <span
          className={`size-2.5 rounded-full border border-surface bg-accent transition-all duration-500 ${active ? "scale-125 shadow-[0_0_0_12px_rgba(184,138,101,0.2)]" : "group-hover/hot:scale-110"}`}
        />
      </button>
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-full mt-3 flex flex-col items-center gap-2 transition-all duration-500 ${active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none group-hover/hot:opacity-100 md:opacity-0"}`}
      >
        <span className="whitespace-nowrap px-3 py-2 bg-surface border border-border text-[0.625rem] tracking-[0.2em] uppercase text-foreground">
          {spot.label}
        </span>
        {active && (
          <HotspotLink spot={spot} className="text-eyebrow link-underline !text-surface whitespace-nowrap">
            View piece
          </HotspotLink>
        )}
      </div>
    </div>
  );
}

export function ShopTheMood() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { image, alt, hotspots } = SHOP_THE_MOOD;

  return (
    <section className="page-wrap section-pad section-gap">
      <Reveal>
        <div className="mb-10 md:mb-14 max-w-xl">
          <p className="text-eyebrow">Shop the mood</p>
          <h2 className="font-display text-3xl md:text-5xl mt-2 leading-[1.02]">Dress the scene</h2>
          <p className="text-caption mt-4">
            Tap a point to discover the piece — curated for slow mornings and golden hours.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div
          className="relative overflow-hidden aspect-[4/5] md:aspect-[21/9] bg-secondary"
          onClick={() => setActiveId(null)}
        >
          <img src={image} alt={alt} className="size-full object-cover image-editorial" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-transparent to-transparent pointer-events-none" />
          {hotspots.map((spot) => (
            <Hotspot
              key={spot.id}
              spot={spot}
              active={activeId === spot.id}
              onActivate={() => setActiveId(spot.id)}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
