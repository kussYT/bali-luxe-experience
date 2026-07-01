import { createFileRoute, Link } from "@tanstack/react-router";
import { focalObjectPosition } from "@/lib/image-focal";
import { NAV_ABOUT } from "@/lib/navigation";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "La marque — Bingin Diaries" },
      {
        name: "description",
        content: "L'histoire de Bingin Diaries — chapeaux artisanaux entre Bali, le Portugal et la France.",
      },
      { property: "og:image", content: "/logo.png" },
    ],
  }),
  component: About,
});

function About() {
  const { about } = useSiteContent();

  return (
    <div className="bg-white min-h-screen">
      <section className="page-wrap section-pad pt-24 pb-16 md:pb-20">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] gap-12 lg:gap-20 items-start">
          <div className="max-w-3xl">
            <p className="text-eyebrow">{about.eyebrow}</p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl mt-4 leading-[0.92] tracking-tight">
              {about.title}
            </h1>

            {about.youtubeId && (
              <div className="mt-12 aspect-video bg-neutral-100 overflow-hidden max-w-2xl">
                <iframe
                  title="Bingin Diaries — la marque"
                  src={`https://www.youtube.com/embed/${about.youtubeId}`}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <nav className="mt-14 space-y-1 border-t border-border pt-10">
              {NAV_ABOUT.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  search={item.search as never}
                  hash={item.hash}
                  className="group flex items-center justify-between py-4 border-b border-border text-sm md:text-base tracking-[0.04em] hover:text-foreground/70 transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-foreground/30 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </nav>

            <div className="lg:hidden mt-10">
              <p className="text-eyebrow mb-5">Explore</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {about.sidebarLinks.map((item) => (
                  <Link
                    key={`mobile-${item.label}`}
                    to={item.to}
                    hash={item.hash}
                    className="group relative overflow-hidden aspect-[4/5] bg-neutral-100"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                      style={{ objectPosition: focalObjectPosition(item.imageFocal) }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-foreground/25" />
                    <p className="absolute bottom-2.5 left-2.5 right-2.5 text-surface text-[0.5625rem] sm:text-[0.625rem] font-medium tracking-[0.16em] uppercase leading-snug">
                      {item.label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-16 space-y-16 md:space-y-20">
              {about.sections.map((section) => (
                <article key={section.id} id={section.id} className="scroll-mt-28">
                  <p className="text-eyebrow">{section.eyebrow}</p>
                  <h2 className="font-display text-3xl md:text-4xl mt-3 leading-tight">{section.title}</h2>
                  <p className="mt-5 text-foreground/70 leading-relaxed text-base md:text-lg max-w-2xl">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-20 grid sm:grid-cols-3 gap-10">
              {about.values.map((b) => (
                <div key={b.n}>
                  <p className="font-mono text-foreground/40 text-sm">{b.n}</p>
                  <h3 className="font-display text-xl mt-2">{b.t}</h3>
                  <p className="text-foreground/60 mt-2 text-sm leading-relaxed">{b.d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="hidden lg:block sticky top-28">
            <p className="text-eyebrow mb-6">Explore</p>
            <div className="grid grid-cols-2 gap-3">
              {about.sidebarLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  hash={item.hash}
                  className="group relative overflow-hidden aspect-[3/4] bg-neutral-100"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition-transform duration-[1.6s] group-hover:scale-105"
                    style={{ objectPosition: focalObjectPosition(item.imageFocal) }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/35 transition-colors" />
                  <p className="absolute bottom-3 left-3 right-3 text-surface text-[0.625rem] font-medium tracking-[0.18em] uppercase leading-snug">
                    {item.label}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
