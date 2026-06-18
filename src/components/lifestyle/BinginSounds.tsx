import { Reveal } from "@/components/lifestyle/Reveal";
import { useSiteContent } from "@/lib/content-context";

export function BinginSounds() {
  const { homepage } = useSiteContent();
  const { title, playlistName, description, spotifyUrl, spotifyPlaylistId } = homepage.binginSounds;
  const embedSrc = `https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`;

  return (
    <section className="page-wrap section-pad py-16 md:py-20">
      <Reveal>
        <div className="border border-border bg-surface p-6 md:p-10 lg:p-12 grid lg:grid-cols-[1fr_minmax(0,380px)] gap-8 lg:gap-12 items-center">
          <div className="max-w-lg">
            <p className="text-eyebrow">{title}</p>
            <p className="font-display text-2xl md:text-3xl mt-3 leading-[1.1] italic">{description}</p>
            <p className="text-caption mt-4">{playlistName} · by Bingin Diaries</p>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-6 text-eyebrow link-underline !text-foreground"
            >
              Open in Spotify
            </a>
          </div>

          <div className="rounded-sm overflow-hidden border border-border bg-secondary aspect-square max-h-[380px] w-full">
            <iframe
              title={`${playlistName} on Spotify`}
              src={embedSrc}
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="size-full min-h-[280px]"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
