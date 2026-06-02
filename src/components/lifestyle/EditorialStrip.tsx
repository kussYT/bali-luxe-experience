import { Link } from "@tanstack/react-router";
import { EDITORIAL_FEATURE } from "@/data/lifestyle-content";
import { Reveal } from "@/components/lifestyle/Reveal";

export function EditorialStrip() {
  const block = EDITORIAL_FEATURE;

  return (
    <section className="editorial-rule bg-surface">
      <Reveal>
        <div className="page-wrap section-pad py-14 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div className="overflow-hidden aspect-[4/5] bg-secondary w-full">
              <img
                src={block.image}
                alt=""
                loading="lazy"
                className="size-full object-cover image-editorial"
              />
            </div>
            <div className="lg:py-6">
              <p className="text-eyebrow mb-5">{block.sub}</p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.04] max-w-[14ch]">
                {block.line}
              </h2>
              <p className="text-caption mt-6 max-w-md">{block.body}</p>
              <Link to="/about" className="inline-block mt-8 text-eyebrow link-underline !text-foreground">
                Our story
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
