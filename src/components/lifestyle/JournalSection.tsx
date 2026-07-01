import { Link } from "@tanstack/react-router";
import { Reveal } from "@/components/lifestyle/Reveal";
import { focalObjectPosition } from "@/lib/image-focal";

export function JournalSection({ showHeader = true }: { showHeader?: boolean }) {
  const { posts, homepage } = useSiteContent();
  const header = homepage.journalSection;

  return (
    <section className={`page-wrap section-pad ${showHeader ? "section-gap" : "pb-16 md:pb-24"}`}>
      {showHeader && (
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 md:mb-16">
            <div>
              <p className="text-eyebrow">{header.eyebrow}</p>
              <h2 className="font-display text-3xl md:text-5xl mt-2">{header.title}</h2>
            </div>
            <Link
              to="/travel-diaries"
              className="text-eyebrow link-underline !text-muted-foreground hover:!text-foreground"
            >
              View all stories
            </Link>
          </div>
        </Reveal>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {posts.map((article, i) => (
          <Reveal key={article.slug} delay={i * 70}>
            <Link to="/journal/$slug" params={{ slug: article.slug }} className="group block">
              <div className="overflow-hidden aspect-[4/5] bg-secondary">
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="size-full object-cover image-editorial transition-transform duration-[1.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  style={{ objectPosition: focalObjectPosition(article.imageFocal) }}
                />
              </div>
              <p className="text-eyebrow mt-5">{article.category}</p>
              <h3 className="font-display text-2xl mt-2 leading-tight group-hover:text-accent transition-colors duration-500">
                {article.title}
              </h3>
              <p className="text-caption mt-2 line-clamp-2">{article.excerpt}</p>
              <span className="inline-block mt-4 text-eyebrow link-underline !text-foreground">
                Read more
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
