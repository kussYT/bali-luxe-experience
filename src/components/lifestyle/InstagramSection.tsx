import { INSTAGRAM } from "@/data/instagram-content";
import { useInstagramFeed } from "@/lib/use-instagram-feed";
import { Reveal } from "@/components/lifestyle/Reveal";

export function InstagramSection() {
  const { feed, loading, error } = useInstagramFeed();
  const { handle, profileUrl, title, subtitle } = feed.profile;

  return (
    <section className="page-wrap section-pad section-gap editorial-rule">
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-14">
          <div>
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-eyebrow link-underline !text-muted-foreground hover:!text-foreground"
            >
              {handle}
            </a>
            <h2 className="font-display text-3xl md:text-5xl mt-2">{title}</h2>
            <p className="text-caption mt-3 italic">{subtitle}</p>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-outline shrink-0"
          >
            Follow on Instagram
          </a>
        </div>
      </Reveal>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-secondary animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {feed.posts.map((post, i) => (
            <Reveal key={post.id} delay={i * 50}>
              <a
                href={post.permalink ?? profileUrl}
                target="_blank"
                rel="noreferrer"
                className="group block aspect-square overflow-hidden bg-secondary"
              >
                <img
                  src={post.image}
                  alt={post.alt}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover image-editorial transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </a>
            </Reveal>
          ))}
        </div>
      )}

      <p className="text-caption text-center mt-8">
        <a href={profileUrl} target="_blank" rel="noreferrer" className="link-underline !text-foreground">
          {profileUrl.replace("https://www.", "")}
        </a>
        {error && <span className="block mt-2 text-[0.7rem] opacity-60">{error}</span>}
        {feed.source === "graph-api" && feed.syncedAt && (
          <span className="block mt-2 text-[0.7rem] opacity-60">
            Live from Instagram · updated {new Date(feed.syncedAt).toLocaleDateString()}
          </span>
        )}
      </p>
    </section>
  );
}
