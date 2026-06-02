import { CRAFT_DETAILS } from "@/data/lifestyle-content";
import { Reveal } from "@/components/lifestyle/Reveal";

export function CraftSection() {
  return (
    <section className="bg-secondary/50 section-pad section-gap">
      <div className="page-wrap">
        <Reveal>
          <div className="max-w-xl mb-12 md:mb-16">
            <p className="text-eyebrow">Craft & material</p>
            <h2 className="font-display text-3xl md:text-5xl mt-2">The details that matter</h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {CRAFT_DETAILS.map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <article className="group">
                <div className="overflow-hidden aspect-square bg-secondary">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover image-editorial transition-transform duration-[1.8s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                </div>
                <h3 className="font-display text-xl md:text-2xl mt-5">{item.title}</h3>
                <p className="text-caption mt-2">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
