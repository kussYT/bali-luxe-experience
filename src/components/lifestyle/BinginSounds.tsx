import { Reveal } from "@/components/lifestyle/Reveal";
import { useSiteContent } from "@/lib/content-context";

function playlistIdFrom(value: string) {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (fromUrl) return fromUrl[1];
  return trimmed.split("?")[0].split("&")[0];
}

export function BinginSounds() {
  const { homepage } = useSiteContent();
  const { title, playlistName, description, spotifyUrl, spotifyPlaylistId } = homepage.binginSounds;
  const playlistId = playlistIdFrom(spotifyPlaylistId || spotifyUrl || "");
  const embedSrc = playlistId
    ? `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`
    : "";

  return (
    <section id="bingin-sounds" className="page-wrap section-pad py-16 md:py-20 bg-white border-t border-border scroll-mt-24">
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
            {embedSrc ? (
              <iframe
                title={`${playlistName} on Spotify`}
                src={embedSrc}
                width="100%"
                height="100%"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="size-full min-h-[280px]"
              />
            ) : (
              <p className="p-6 text-caption text-muted-foreground">Spotify playlist not configured.</p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
