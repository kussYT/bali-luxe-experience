import type { JournalPostBlock } from "@/lib/content-types";
import { focalForSlot } from "@/lib/journal-blocks";
import { focalObjectPosition } from "@/lib/image-focal";

type Props = {
  blocks: JournalPostBlock[];
};

export function JournalArticleBlocks({ blocks }: Props) {
  return (
    <div className="space-y-12 md:space-y-16">
      {blocks.map((block, index) => {
        if (block.type === "text") {
          const paragraphs = block.paragraphs.filter((p) => p.trim());
          if (paragraphs.length === 0) return null;
          return (
            <div key={`text-${index}`} className="space-y-5 text-[1.05rem] leading-relaxed text-muted-foreground">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          );
        }

        if (block.type === "photoPair") {
          const slots = [block.left, block.right].filter((s) => s.image?.trim());
          if (slots.length === 0) return null;
          return (
            <div
              key={`pair-${index}`}
              className={`grid gap-4 md:gap-6 ${slots.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}
            >
              {[block.left, block.right]
                .filter((s) => s.image?.trim())
                .map((slot, i) => (
                  <figure key={`${slot.image}-${i}`} className="space-y-3">
                    <div className="overflow-hidden bg-secondary aspect-[4/5]">
                      <img
                        src={slot.image}
                        alt={slot.alt || slot.caption || ""}
                        className="size-full object-cover image-editorial"
                        style={{ objectPosition: focalObjectPosition(focalForSlot(slot)) }}
                      />
                    </div>
                    {slot.caption?.trim() && (
                      <figcaption className="text-caption text-center">{slot.caption}</figcaption>
                    )}
                  </figure>
                ))}
            </div>
          );
        }

        if (block.type === "photo" && block.image?.trim()) {
          return (
            <figure key={`photo-${index}`} className="space-y-3">
              <div className="overflow-hidden bg-secondary aspect-[16/10] md:aspect-[3/2]">
                <img
                  src={block.image}
                  alt={block.alt || block.caption || ""}
                  className="size-full object-cover image-editorial"
                  style={{ objectPosition: focalObjectPosition(focalForSlot(block)) }}
                />
              </div>
              {block.caption?.trim() && (
                <figcaption className="text-caption text-center">{block.caption}</figcaption>
              )}
            </figure>
          );
        }

        return null;
      })}
    </div>
  );
}
