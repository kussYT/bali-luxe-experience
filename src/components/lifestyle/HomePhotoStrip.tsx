import { Link } from "@tanstack/react-router";
import { useSiteContent } from "@/lib/content-context";
import type { HomePhotoTile } from "@/lib/content-types";

/** Portrait strip — stacked on mobile, equal columns on md+. */
const TILE_HEIGHT_MOBILE = "min-h-[72vh] sm:min-h-[80vh]";
const STRIP_HEIGHT =
  "min-h-[72vh] sm:min-h-[80vh] md:min-h-[92vh] lg:min-h-[96vh]";

function TileLink({ tile }: { tile: HomePhotoTile }) {
  const inner = (
    <div
      className={`group relative overflow-hidden bg-neutral-100 ${TILE_HEIGHT_MOBILE} md:min-h-0 md:h-full`}
    >      <img
        src={tile.image}
        alt={tile.label}
        loading="lazy"
        className="absolute inset-0 size-full object-cover object-center transition-transform duration-[1.8s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/15 transition-colors duration-500" />
      <p className="absolute top-3 left-3 sm:top-5 sm:left-5 md:top-6 md:left-6 text-surface text-[0.5625rem] sm:text-[0.6875rem] font-medium tracking-[0.18em] sm:tracking-[0.22em] uppercase leading-snug drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]">
        {tile.label}
      </p>
    </div>
  );

  if (tile.href.startsWith("http")) {
    return (
      <a href={tile.href} className="block min-w-0 md:h-full">
        {inner}
      </a>
    );
  }

  return (
    <Link to={tile.href} search={tile.search as never} className="block min-w-0 md:h-full">
      {inner}
    </Link>
  );}

export function HomePhotoStrip() {
  const { homepage } = useSiteContent();
  const strip = homepage.photoStrip;
  if (!strip?.tiles?.length) return null;

  if (strip.layout === "landscape" && strip.tiles[0]) {
    const tile = strip.tiles[0];
    return (
      <section className="w-full">
        {tile.href.startsWith("http") ? (
          <a href={tile.href} className={`block group overflow-hidden ${STRIP_HEIGHT}`}>
            <img
              src={tile.image}
              alt={tile.label}
              className="size-full object-cover image-editorial transition-transform duration-[2s] group-hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
        ) : (
          <Link
            to={tile.href}
            search={tile.search as never}
            className={`block group overflow-hidden ${STRIP_HEIGHT}`}
          >
            <img
              src={tile.image}
              alt={tile.label}
              className="size-full object-cover image-editorial transition-transform duration-[2s] group-hover:scale-[1.02]"
              loading="lazy"
            />
          </Link>
        )}
      </section>
    );
  }

  const tileCount = strip.tiles.length;

  return (
    <section className="w-full bg-white">
      <div
        className={`grid gap-0 grid-cols-1 md:min-h-[92vh] lg:min-h-[96vh] ${
          tileCount === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        }`}
      >        {strip.tiles.map((tile) => (
          <TileLink key={tile.label} tile={tile} />
        ))}
      </div>
    </section>
  );
}
