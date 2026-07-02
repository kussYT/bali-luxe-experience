import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCmsMedia } from "@/lib/admin-api";
import { UPLOADS_UNAVAILABLE_MESSAGE, useUploadsAvailable } from "@/lib/use-uploads-available";
import { AdminImagePreview } from "@/components/admin/AdminImagePreview";
import { ImageFocalPicker } from "@/components/admin/ImageFocalPicker";
import { DEFAULT_IMAGE_FOCAL, type ImageFocal } from "@/lib/image-focal";
import type { UploadProgress } from "@/lib/upload-admin-files";

type CmsMediaFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
  accept?: string;
  hint?: string;
  focal?: ImageFocal;
  onFocalChange?: (focal: ImageFocal) => void;
  focalAspect?: number;
};

export function CmsMediaField({
  label,
  value,
  onChange,
  folder,
  accept = "image/*,video/mp4,video/webm",
  hint,
  focal,
  onFocalChange,
  focalAspect,
}: CmsMediaFieldProps) {
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value) || value.includes("/hero.mp4");
  const showFocal = Boolean(value && !isVideo && onFocalChange);
  const resolvedFocal = focal ?? DEFAULT_IMAGE_FOCAL;

  function applyUrl(next: string) {
    if (next !== value) onFocalChange?.(DEFAULT_IMAGE_FOCAL);
    onChange(next);
  }

  async function handleUpload(files: FileList | null) {
    if (!uploadsAvailable || !files?.length) return;
    setUploading(true);
    setUploadProgress(null);
    setError(null);
    try {
      const { urls } = await uploadCmsMedia(folder, files, setUploadProgress);
      if (urls[0]) applyUrl(urls[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input value={value} onChange={(e) => applyUrl(e.target.value)} className="flex-1 min-w-[200px]" />
        {!uploadsLoading && uploadsAvailable && (
          <label>
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>{uploading ? "Envoi…" : "Uploader un fichier"}</span>
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {!uploadsLoading && !uploadsAvailable && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{UPLOADS_UNAVAILABLE_MESSAGE}</p>
      )}
      {uploading && (
        <p className="text-xs text-muted-foreground">
          {uploadProgress?.phase === "preparing"
            ? "Préparation de l’image…"
            : uploadProgress
              ? `Envoi ${uploadProgress.current}/${uploadProgress.total}…`
              : "Envoi…"}
        </p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && !showFocal && (
        <div className="mt-2 overflow-hidden border border-border bg-muted/30 max-w-xs">
          {isVideo ? (
            <video src={value} className="w-full max-h-40 object-cover" muted playsInline controls />
          ) : (
            <AdminImagePreview src={value} alt="" className="w-full max-h-40 object-cover" />
          )}
        </div>
      )}
      {showFocal && (
        <ImageFocalPicker
          imageUrl={value}
          focalX={resolvedFocal.x}
          focalY={resolvedFocal.y}
          onChange={onFocalChange!}
          aspect={focalAspect}
        />
      )}
    </div>
  );
}
