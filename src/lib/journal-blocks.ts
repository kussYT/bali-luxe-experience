import type { JournalPostBlock, JournalPhotoSlot } from "@/lib/content-types";
import { DEFAULT_IMAGE_FOCAL } from "@/lib/image-focal";

export function emptyPhotoSlot(): JournalPhotoSlot {
  return { image: "", caption: "" };
}

/** Beatrice wireframe: texte → 2 photos → texte → photo */
export function defaultArticleBlocks(): JournalPostBlock[] {
  return [
    { type: "text", paragraphs: [""] },
    { type: "photoPair", left: emptyPhotoSlot(), right: emptyPhotoSlot() },
    { type: "text", paragraphs: [""] },
    { type: "photo", ...emptyPhotoSlot() },
  ];
}

function normalizePhotoSlot(raw: unknown): JournalPhotoSlot {
  if (!raw || typeof raw !== "object") return emptyPhotoSlot();
  const slot = raw as JournalPhotoSlot;
  return {
    image: typeof slot.image === "string" ? slot.image : "",
    caption: typeof slot.caption === "string" ? slot.caption : "",
    imageFocal:
      slot.imageFocal && typeof slot.imageFocal === "object"
        ? { x: Number(slot.imageFocal.x) || 50, y: Number(slot.imageFocal.y) || 50 }
        : undefined,
    alt: typeof slot.alt === "string" ? slot.alt : undefined,
  };
}

export function normalizeJournalBlocks(raw: unknown): JournalPostBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: JournalPostBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const block = item as JournalPostBlock;
    if (block.type === "text") {
      const paragraphs = Array.isArray(block.paragraphs)
        ? block.paragraphs.map((p) => String(p ?? "")).filter((p) => p.trim())
        : [];
      blocks.push({ type: "text", paragraphs: paragraphs.length ? paragraphs : [""] });
    } else if (block.type === "photo") {
      blocks.push({ type: "photo", ...normalizePhotoSlot(block) });
    } else if (block.type === "photoPair") {
      blocks.push({
        type: "photoPair",
        left: normalizePhotoSlot(block.left),
        right: normalizePhotoSlot(block.right),
      });
    }
  }
  return blocks;
}

export function resolvePostBlocks(fields: {
  blocks?: JournalPostBlock[];
  body?: string[];
}): JournalPostBlock[] {
  const fromBlocks = normalizeJournalBlocks(fields.blocks);
  if (fromBlocks.length > 0) return fromBlocks;
  const body = Array.isArray(fields.body) ? fields.body.filter((p) => p?.trim()) : [];
  if (body.length > 0) return [{ type: "text", paragraphs: body }];
  return defaultArticleBlocks();
}

export function bodyFromBlocks(blocks: JournalPostBlock[]): string[] {
  return blocks
    .filter((b): b is Extract<JournalPostBlock, { type: "text" }> => b.type === "text")
    .flatMap((b) => b.paragraphs.map((p) => p.trim()).filter(Boolean));
}

export function textFromBlocks(blocks: JournalPostBlock[]): string {
  return blocks
    .filter((b): b is Extract<JournalPostBlock, { type: "text" }> => b.type === "text")
    .flatMap((b) => b.paragraphs)
    .join("\n\n");
}

export function blocksFromText(text: string, existing: JournalPostBlock[]): JournalPostBlock[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return existing.map((block) => {
    if (block.type !== "text") return block;
    return { type: "text", paragraphs: paragraphs.length ? paragraphs : [""] };
  });
}

export function focalForSlot(slot: JournalPhotoSlot) {
  return slot.imageFocal ?? DEFAULT_IMAGE_FOCAL;
}
