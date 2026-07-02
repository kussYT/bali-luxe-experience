import { useState } from "react";

type AdminImagePreviewProps = {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AdminImagePreview({ src, alt = "", className, style }: AdminImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const displaySrc = src.includes("?") ? src : `${src}?v=1`;

  if (!src) return null;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-center p-3 text-xs text-muted-foreground ${className ?? ""}`}
        style={style}
      >
        Aperçu indisponible — vérifiez l&apos;URL ou ré-uploadez en JPEG
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
