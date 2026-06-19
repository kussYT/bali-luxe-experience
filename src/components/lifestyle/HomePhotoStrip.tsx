import { Link } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/content-context";
import type { HomePhotoTile } from "@/lib/content-types";

function TileLink({ tile }: { tile: HomePhotoTile }) {
  const inner = (
    <div className="group relative overflow-hidden bg-white aspect-[4/5] md:aspect-auto md:min-h-[280px]">
      <img
        src={tile.image}
        alt={tile.label}
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-[1.8s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/20 transition-colors" />
      <p className="absolute bottom-4 left-4 md:bottom-6 md:left-6 text-surface text-[0.6875rem] font-medium tracking-[0.22em] uppercase">
        {tile.label}
      </p>
    </div>
  );

  if (tile.href.startsWith("http")) {
    return (
      <a href={tile.href} className="block">
        {inner}
      </a>
    );
  }

  return (
    <Link to={tile.href} search={tile.search as never} className="block">
      {inner}
    </Link>
  );
}

export function HomePhotoStrip() {
  const { homepage } = useSiteContent();
  const strip = homepage.photoStrip;
  if (!strip?.tiles?.length) return null;

  if (strip.layout === "landscape" && strip.tiles[0]) {
    const tile = strip.tiles[0];
    return (
      <section className="page-wrap section-pad py-8 md:py-12">
        {tile.href.startsWith("http") ? (
          <a href={tile.href} className="block group overflow-hidden">
            <img
              src={tile.image}
              alt={tile.label}
              className="w-full aspect-[21/9] md:aspect-[24/9] object-cover image-editorial transition-transform duration-[2s] group-hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
        ) : (
          <Link to={tile.href} search={tile.search as never} className="block group overflow-hidden">
            <img
              src={tile.image}
              alt={tile.label}
              className="w-full aspect-[21/9] md:aspect-[24/9] object-cover image-editorial transition-transform duration-[2s] group-hover:scale-[1.02]"
              loading="lazy"
            />
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className="page-wrap section-pad py-8 md:py-12">
      <div
        className={`grid gap-2 md:gap-3 ${
          strip.tiles.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
        }`}
      >
        {strip.tiles.map((tile) => (
          <TileLink key={tile.label} tile={tile} />
        ))}
      </div>
    </section>
  );
}
