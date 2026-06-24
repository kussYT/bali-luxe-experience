import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadCmsMedia } from "@/lib/admin-api";
import { UPLOADS_UNAVAILABLE_MESSAGE, useUploadsAvailable } from "@/lib/use-uploads-available";

type CmsMediaFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
  accept?: string;
  hint?: string;
};

export function CmsMediaField({
  label,
  value,
  onChange,
  folder,
  accept = "image/*,video/mp4,video/webm",
  hint,
}: CmsMediaFieldProps) {
  const { available: uploadsAvailable, loading: uploadsLoading } = useUploadsAvailable();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = /\.(mp4|webm)(\?|$)/i.test(value) || value.includes("/hero.mp4");

  async function handleUpload(files: FileList | null) {
    if (!uploadsAvailable || !files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const { urls } = await uploadCmsMedia(folder, files);
      if (urls[0]) onChange(urls[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-[200px]" />
        {!uploadsLoading && uploadsAvailable && (
          <label>
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>{uploading ? "Envoi…" : "Uploader un fichier"}</span>
            </Button>
            <input
              type="file"
              accept={accept}
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
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {value && (
        <div className="mt-2 overflow-hidden border border-border bg-muted/30 max-w-xs">
          {isVideo ? (
            <video src={value} className="w-full max-h-40 object-cover" muted playsInline controls />
          ) : (
            <img src={value} alt="" className="w-full max-h-40 object-cover" />
          )}
        </div>
      )}
    </div>
  );
}
