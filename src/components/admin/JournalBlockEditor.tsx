import type { JournalPostBlock, JournalPhotoSlot } from "@/lib/content-types";
import {
  defaultArticleBlocks,
  emptyPhotoSlot,
  normalizeJournalBlocks,
  textFromBlocks,
} from "@/lib/journal-blocks";
import { CmsMediaField } from "@/components/admin/CmsMediaField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

type Props = {
  blocks: JournalPostBlock[];
  onChange: (blocks: JournalPostBlock[]) => void;
  mediaFolder: string;
};

function blockLabel(block: JournalPostBlock) {
  if (block.type === "text") return "Texte";
  if (block.type === "photoPair") return "2 photos";
  return "Photo";
}

function patchTextBlock(block: Extract<JournalPostBlock, { type: "text" }>, text: string) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return { type: "text" as const, paragraphs: paragraphs.length ? paragraphs : [""] };
}

function PhotoSlotFields({
  label,
  slot,
  folder,
  onChange,
}: {
  label: string;
  slot: JournalPhotoSlot;
  folder: string;
  onChange: (slot: JournalPhotoSlot) => void;
}) {
  return (
    <div className="space-y-3 border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <CmsMediaField
        label="Image"
        folder={folder}
        value={slot.image}
        onChange={(image) => onChange({ ...slot, image })}
        focal={slot.imageFocal}
        onFocalChange={(imageFocal) => onChange({ ...slot, imageFocal })}
        focalAspect={4 / 5}
      />
      <div className="space-y-1.5">
        <Label className="text-xs">Légende (optionnel)</Label>
        <Textarea
          rows={2}
          value={slot.caption ?? ""}
          onChange={(e) => onChange({ ...slot, caption: e.target.value })}
        />
      </div>
    </div>
  );
}

export function JournalBlockEditor({ blocks, onChange, mediaFolder }: Props) {
  const normalized = normalizeJournalBlocks(blocks);
  const list = normalized.length > 0 ? normalized : defaultArticleBlocks();

  function updateBlock(index: number, next: JournalPostBlock) {
    onChange(list.map((b, i) => (i === index ? next : b)));
  }

  function removeBlock(index: number) {
    onChange(list.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addBlock(type: JournalPostBlock["type"]) {
    if (type === "text") onChange([...list, { type: "text", paragraphs: [""] }]);
    else if (type === "photo") onChange([...list, { type: "photo", ...emptyPhotoSlot() }]);
    else onChange([...list, { type: "photoPair", left: emptyPhotoSlot(), right: emptyPhotoSlot() }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => addBlock("text")}>
          <Plus className="size-3.5 mr-1" /> Texte
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addBlock("photoPair")}>
          <Plus className="size-3.5 mr-1" /> 2 photos
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => addBlock("photo")}>
          <Plus className="size-3.5 mr-1" /> Photo
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(defaultArticleBlocks())}>
          Template article
        </Button>
      </div>

      {list.map((block, index) => (
        <div key={`block-${index}`} className="border border-border p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{blockLabel(block)}</p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon" className="size-8" disabled={index === 0} onClick={() => moveBlock(index, -1)}>
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                disabled={index === list.length - 1}
                onClick={() => moveBlock(index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => removeBlock(index)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {block.type === "text" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Paragraphes (séparés par une ligne vide)</Label>
              <Textarea
                rows={6}
                value={textFromBlocks([block])}
                onChange={(e) => updateBlock(index, patchTextBlock(block, e.target.value))}
              />
            </div>
          )}

          {block.type === "photo" && (
            <PhotoSlotFields
              label="Photo pleine largeur"
              slot={block}
              folder={mediaFolder}
              onChange={(slot) => updateBlock(index, { type: "photo", ...slot })}
            />
          )}

          {block.type === "photoPair" && (
            <div className="grid md:grid-cols-2 gap-4">
              <PhotoSlotFields
                label="Photo gauche"
                slot={block.left}
                folder={mediaFolder}
                onChange={(left) => updateBlock(index, { ...block, left })}
              />
              <PhotoSlotFields
                label="Photo droite"
                slot={block.right}
                folder={mediaFolder}
                onChange={(right) => updateBlock(index, { ...block, right })}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
