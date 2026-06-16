import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HERO_TAGLINE, HERO_VIDEO_SRC } from "@/data/lifestyle-content";

type CinematicHeroProps = {
  poster: string;
  videoSrc?: string;
};

export function CinematicHero({ poster, videoSrc = HERO_VIDEO_SRC }: CinematicHeroProps) {
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const showVideo = !videoFailed;

  return (
    <section className="relative min-h-[92vh] md:min-h-[96vh] overflow-hidden bg-foreground grain">
      {showVideo && (
        <video
          className={`absolute inset-0 size-full object-cover image-editorial transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          aria-hidden
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      <img
        src={poster}
        alt=""
        className={`absolute inset-0 size-full object-cover image-editorial animate-zoom-out transition-opacity duration-1000 ${showVideo && videoReady ? "opacity-0" : "opacity-100"}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-foreground/30" />

      <div className="relative min-h-[92vh] md:min-h-[96vh] flex flex-col justify-end page-wrap section-pad pb-14 md:pb-20 text-surface animate-fade-up">
        <p className="text-eyebrow !text-surface/65 mb-5 md:mb-7">Bingin Diaries · Bali & France</p>
        <h1 className="font-display text-[10vw] md:text-[5.5rem] lg:text-[6.5rem] leading-[0.92] max-w-[14ch] font-light italic">
          {HERO_TAGLINE}
        </h1>
        <p className="text-caption max-w-md mt-6 md:mt-8 !text-surface/75">
          Bali stories, worn everywhere — slow fashion for sun, travel, and the art of living lightly.
        </p>
        <div className="mt-9 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
          <Link
            to="/collection"
            className="btn-primary bg-surface text-foreground hover:bg-accent hover:text-surface"
          >
            Shop the collection
          </Link>
          <Link to="/travel-diaries" className="btn-outline !border-surface/40 !text-surface hover:!bg-surface hover:!text-foreground">
            Explore the journal
          </Link>
        </div>
      </div>
    </section>
  );
}
