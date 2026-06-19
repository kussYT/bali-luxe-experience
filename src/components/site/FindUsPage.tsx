import { Link } from "@tanstack/react-router";
import { STOCKISTS } from "@/data/stockists";
import { ATLIST_EMBED_URL, ATLIST_MAP_URL } from "@/data/atlist";
import { Reveal } from "@/components/lifestyle/Reveal";

export function FindUsPage() {
  const { wholesaleEmail, countries } = STOCKISTS;
  const hasAtlistEmbed = Boolean(ATLIST_EMBED_URL);

  return (
    <>
      <header className="page-wrap section-pad pt-20 md:pt-28 pb-10 md:pb-14 text-center border-b border-border bg-white">
        <Reveal>
          <p className="text-eyebrow">Retailers</p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.92]">Find us</h1>
          <p className="text-caption mt-6 max-w-lg mx-auto">
            Discover Bingin Diaries at select boutiques around the world — from Bali to Europe and beyond.
          </p>
        </Reveal>
      </header>

      <div className="page-wrap section-pad py-12 md:py-16 bg-white">
        {hasAtlistEmbed ? (
          <Reveal>
            <div className="mb-12 md:mb-16 overflow-hidden border border-border bg-white">
              <iframe
                title="Bingin Diaries — store locator (Atlist)"
                src={ATLIST_EMBED_URL}
                className="w-full min-h-[420px] md:min-h-[520px] border-0"
                loading="lazy"
                allow="geolocation"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mb-16">
              <a href={ATLIST_MAP_URL} target="_blank" rel="noreferrer" className="link-underline">
                Open full map on Atlist
              </a>
            </p>
          </Reveal>
        ) : (
          <Reveal>
            <div className="max-w-2xl mx-auto mb-16 p-8 border border-border bg-secondary/40 text-center">
              <p className="font-display text-2xl italic">Interactive map</p>
              <p className="text-caption mt-4">
                The Atlist store locator will appear here once connected.{" "}
                <a href={ATLIST_MAP_URL} target="_blank" rel="noreferrer" className="link-underline !text-foreground">
                  View on Atlist
                </a>
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                TODO: add <code className="text-foreground">VITE_ATLIST_EMBED_URL</code> from the Bingin Diaries Atlist
                account.
              </p>
            </div>
          </Reveal>
        )}

        <div className="max-w-3xl mx-auto space-y-14 md:space-y-20">
          {countries.map((region, ci) => (
            <Reveal key={region.country} delay={ci * 60}>
              <section>
                <h2 className="font-display text-3xl md:text-4xl mb-8 md:mb-10 pb-4 border-b border-border">
                  {region.country}
                </h2>

                <div className="space-y-10 md:space-y-12">
                  {region.areas.map((area) => (
                    <div key={`${region.country}-${area.name}`}>
                      {area.name !== "General" && (
                        <h3 className="font-display text-xl md:text-2xl italic text-foreground/90 mb-4 underline decoration-border underline-offset-4">
                          {area.name}
                        </h3>
                      )}
                      <ul className="space-y-2.5 md:space-y-3">
                        {area.stores.map((store) => (
                          <li key={store.name} className="text-[0.9375rem] md:text-base leading-relaxed">
                            {store.url ? (
                              <a
                                href={store.url}
                                target="_blank"
                                rel="noreferrer"
                                className="link-underline text-foreground hover:text-accent transition-colors duration-500"
                              >
                                {store.name}
                                {store.instagram && (
                                  <span className="text-muted-foreground font-normal"> · {store.instagram}</span>
                                )}
                              </a>
                            ) : (
                              <span>
                                {store.name}
                                {store.instagram && (
                                  <span className="text-muted-foreground"> · {store.instagram}</span>
                                )}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="max-w-2xl mx-auto mt-20 md:mt-28 pt-12 border-t border-border text-center">
            <p className="font-display text-2xl md:text-3xl leading-[1.15] italic">
              You are a retailer and want to work with us?
            </p>
            <p className="text-caption mt-5">
              Please email us at{" "}
              <a href={`mailto:${wholesaleEmail}`} className="link-underline !text-foreground">
                {wholesaleEmail}
              </a>
            </p>
            <Link to="/contact" className="inline-block mt-8 btn-outline">
              Contact the house
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
