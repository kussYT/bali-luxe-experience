import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSiteContent } from "@/lib/content-context";

type CinematicHeroProps = {
  poster?: string;
  videoSrc?: string;
};

export function CinematicHero({ poster, videoSrc }: CinematicHeroProps) {
  const { homepage } = useSiteContent();
  const hero = homepage.hero;
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !videoFailed;
  const resolvedPoster = poster ?? hero.poster;
  const resolvedVideo = videoSrc ?? hero.videoSrc;

  return (
    <section className="relative min-h-[92vh] md:min-h-[96vh] overflow-hidden bg-secondary grain">
      {showVideo && resolvedVideo && (
        <video
          className={`absolute inset-0 size-full object-cover image-editorial transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={resolvedPoster}
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          aria-hidden
        >
          <source src={resolvedVideo} type="video/mp4" />
        </video>
      )}

      <img
        src={resolvedPoster}
        alt=""
        className={`absolute inset-0 size-full object-cover image-editorial animate-zoom-out transition-opacity duration-1000 ${showVideo && videoReady ? "opacity-0" : "opacity-100"}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-foreground/30" />

      <div className="relative min-h-[92vh] md:min-h-[96vh] flex flex-col justify-end page-wrap section-pad pb-14 md:pb-20 text-surface animate-fade-up">
        <p className="text-eyebrow !text-surface/65 mb-5 md:mb-7">{hero.eyebrow}</p>
        <h1 className="font-display text-[10vw] md:text-[5.5rem] lg:text-[6.5rem] leading-[0.92] max-w-[14ch] font-light italic">
          {hero.title}
        </h1>
        <p className="text-caption max-w-md mt-6 md:mt-8 !text-surface/75">{hero.subtitle}</p>
        <div className="mt-9 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
          <Link
            to={hero.ctaPrimaryHref}
            className="btn-primary bg-surface text-foreground hover:bg-accent hover:text-surface"
          >
            {hero.ctaPrimary}
          </Link>
          <Link
            to={hero.ctaSecondaryHref}
            className="btn-outline !border-surface/40 !text-surface hover:!bg-surface hover:!text-foreground"
          >
            {hero.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
