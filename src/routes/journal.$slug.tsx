import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Reveal } from "@/components/lifestyle/Reveal";
import { JournalArticleBlocks } from "@/components/journal/JournalArticleBlocks";
import { resolvePostBlocks } from "@/lib/journal-blocks";
import { useCmsPost } from "@/lib/use-cms-post";
import { focalObjectPosition } from "@/lib/image-focal";

export const Route = createFileRoute("/journal/$slug")({
  head: () => ({
    meta: [{ title: "Journal — Bingin Diaries" }],
  }),
  component: JournalArticlePage,
});

function JournalArticlePage() {
  const { slug } = Route.useParams();
  const article = useCmsPost(slug);

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} — Bingin Diaries Journal`;
    }
  }, [article]);

  if (article === undefined) {
    return <p className="page-wrap section-pad py-32 text-center text-muted-foreground">Loading…</p>;
  }

  if (!article) {
    return (
      <div className="page-wrap section-pad py-32 text-center">
        <h1 className="font-display text-5xl">Story not found</h1>
        <Link to="/travel-diaries" className="mt-6 inline-block text-eyebrow link-underline !text-foreground">
          Back to the journal
        </Link>
      </div>
    );
  }

  const blocks = resolvePostBlocks(article);

  return (
    <article>
      <header className="relative min-h-[50vh] md:min-h-[60vh] overflow-hidden bg-foreground">
        <img
          src={article.image}
          alt=""
          className="absolute inset-0 size-full object-cover image-editorial opacity-90"
          style={{ objectPosition: focalObjectPosition(article.imageFocal) }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <div className="relative page-wrap section-pad py-24 md:py-32 flex flex-col justify-end min-h-[50vh] md:min-h-[60vh] text-surface">
          <p className="text-eyebrow !text-surface/65">
            {article.category} · {article.readMinutes} min read
          </p>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl mt-4 max-w-3xl leading-[1.02]">{article.title}</h1>
          <p className="text-caption mt-6 max-w-xl !text-surface/75">{article.excerpt}</p>
        </div>
      </header>

      <div className="page-wrap section-pad section-gap max-w-3xl">
        <Reveal>
          <JournalArticleBlocks blocks={blocks} />
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row gap-6 justify-between">
            <Link to="/travel-diaries" className="text-eyebrow link-underline !text-foreground">
              All journal stories
            </Link>
            <Link to="/collection" className="btn-outline">
              Shop the collection
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
