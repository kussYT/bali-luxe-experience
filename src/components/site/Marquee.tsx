import { useSiteContent } from "@/lib/content-context";

export function Marquee() {
  const { announcement } = useSiteContent();
  if (!announcement.enabled) return null;

  const textEl = (
    <span className="px-10 shrink-0 text-[0.625rem] font-medium tracking-[0.28em] uppercase text-foreground/85">
      {announcement.text}
    </span>
  );

  const isExternal = announcement.link.startsWith("http");

  return (
    <div className="bg-secondary border-b border-border overflow-hidden py-2.5">
      <div className="flex whitespace-nowrap animate-marquee">
        {Array.from({ length: 4 }).map((_, i) =>
          announcement.link ? (
            isExternal ? (
              <a key={i} href={announcement.link} className="hover:opacity-80 transition-opacity">
                {textEl}
              </a>
            ) : (
              <a key={i} href={announcement.link} className="hover:opacity-80 transition-opacity">
                {textEl}
              </a>
            )
          ) : (
            <span key={i}>{textEl}</span>
          ),
        )}
      </div>
    </div>
  );
}
