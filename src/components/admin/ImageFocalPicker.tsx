import { Label } from "@/components/ui/label";

type ImageFocalPickerProps = {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onChange: (focal: { x: number; y: number }) => void;
  /** Aspect ratio of the preview frame (width / height) */
  aspect?: number;
};

export function ImageFocalPicker({
  imageUrl,
  focalX,
  focalY,
  onChange,
  aspect = 4 / 5,
}: ImageFocalPickerProps) {
  if (!imageUrl) return null;

  return (
    <div className="space-y-3 border border-border p-4 rounded-sm bg-muted/20">
      <p className="text-sm font-medium">Cadrage de la photo</p>
      <p className="text-xs text-muted-foreground">
        Ajustez le curseur pour choisir quelle partie de l&apos;image reste visible une fois recadrée sur le site.
      </p>
      <div
        className="relative mx-auto max-w-xs w-full overflow-hidden border border-border bg-sand"
        style={{ aspectRatio: String(aspect) }}
      >
        <img
          src={imageUrl.includes("?") ? imageUrl : `${imageUrl}?v=1`}
          alt=""
          className="size-full object-cover"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-foreground/80 shadow"
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="space-y-2">
          <Label className="text-xs">Horizontal ({Math.round(focalX)} %)</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={focalX}
            onChange={(e) => onChange({ x: Number(e.target.value), y: focalY })}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Vertical ({Math.round(focalY)} %)</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={focalY}
            onChange={(e) => onChange({ x: focalX, y: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
