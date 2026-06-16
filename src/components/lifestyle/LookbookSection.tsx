import { Link } from "@tanstack/react-router";
import { LOOKBOOK_CHAPTERS } from "@/data/lifestyle-content";
import { Reveal } from "@/components/lifestyle/Reveal";

export function LookbookSection() {
  return (
    <section className="page-wrap section-pad section-gap editorial-rule">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 md:mb-16">
          <div>
            <p className="text-eyebrow">Bali Chapters</p>
            <h2 className="font-display text-3xl md:text-5xl mt-2">Summer stories</h2>
          </div>
          <Link
            to="/collection"
            className="text-eyebrow link-underline !text-muted-foreground hover:!text-foreground"
          >
            Shop the look
          </Link>
        </div>
      </Reveal>

      <div className="space-y-16 md:space-y-24">
        {LOOKBOOK_CHAPTERS.map((chapter, i) => {
          const imageFirst = chapter.align === "left";
          return (
            <Reveal key={chapter.title} delay={i * 100}>
              <div
                className={`flex flex-col gap-8 lg:gap-12 lg:items-center ${imageFirst ? "lg:flex-row" : "lg:flex-row-reverse"}`}
              >
                <div className="lg:w-2/3 overflow-hidden aspect-[16/10] lg:aspect-[2/1] bg-secondary shrink-0">
                  <img
                    src={chapter.image}
                    alt={chapter.title}
                    loading="lazy"
                    className="size-full object-cover image-editorial transition-transform duration-[2s] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02]"
                  />
                </div>
                <div className="lg:w-1/3 lg:py-4">
                  <p className="text-eyebrow">{chapter.title}</p>
                  <p className="font-display text-3xl md:text-4xl mt-3 leading-[1.05]">{chapter.caption}</p>
                  <Link
                    to="/collection"
                    className="inline-block mt-8 text-eyebrow link-underline !text-foreground"
                  >
                    Discover pieces
                  </Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
