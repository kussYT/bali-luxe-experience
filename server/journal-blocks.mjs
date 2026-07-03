export function defaultArticleBlocks() {
  return [
    { type: "text", paragraphs: [""] },
    { type: "photoPair", left: { image: "", caption: "" }, right: { image: "", caption: "" } },
    { type: "text", paragraphs: [""] },
    { type: "photo", image: "", caption: "" },
  ];
}

function normalizePhotoSlot(raw) {
  if (!raw || typeof raw !== "object") return { image: "", caption: "" };
  return {
    image: typeof raw.image === "string" ? raw.image : "",
    caption: typeof raw.caption === "string" ? raw.caption : "",
    imageFocal:
      raw.imageFocal && typeof raw.imageFocal === "object"
        ? { x: Number(raw.imageFocal.x) || 50, y: Number(raw.imageFocal.y) || 50 }
        : undefined,
    alt: typeof raw.alt === "string" ? raw.alt : undefined,
  };
}

export function normalizeJournalBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  const blocks = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "text") {
      const paragraphs = Array.isArray(item.paragraphs)
        ? item.paragraphs.map((p) => String(p ?? "")).filter((p) => p.trim())
        : [];
      blocks.push({ type: "text", paragraphs: paragraphs.length ? paragraphs : [""] });
    } else if (item.type === "photo") {
      blocks.push({ type: "photo", ...normalizePhotoSlot(item) });
    } else if (item.type === "photoPair") {
      blocks.push({
        type: "photoPair",
        left: normalizePhotoSlot(item.left),
        right: normalizePhotoSlot(item.right),
      });
    }
  }
  return blocks;
}

export function resolvePostBlocks(fields) {
  const fromBlocks = normalizeJournalBlocks(fields?.blocks);
  if (fromBlocks.length > 0) return fromBlocks;
  const body = Array.isArray(fields?.body) ? fields.body.filter((p) => p?.trim()) : [];
  if (body.length > 0) return [{ type: "text", paragraphs: body }];
  return defaultArticleBlocks();
}

export function bodyFromBlocks(blocks) {
  return blocks
    .filter((b) => b.type === "text")
    .flatMap((b) => b.paragraphs.map((p) => p.trim()).filter(Boolean));
}
