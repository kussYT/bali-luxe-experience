const HEIC_RE = /\.(heic|heif)$/i;
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.86;
const SKIP_COMPRESS_BELOW_BYTES = 400_000;

export const HEIC_UPLOAD_MESSAGE =
  "Format HEIC (iPhone) non affiché par les navigateurs. Sur iPhone : Réglages → Appareil photo → Formats → « Plus compatible » (JPEG), ou exportez la photo en JPEG avant l’envoi.";

export function isHeicFile(file: File) {
  return HEIC_RE.test(file.name) || file.type === "image/heic" || file.type === "image/heif";
}

function isCompressibleImage(file: File) {
  if (!file.type.startsWith("image/")) return false;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return false;
  if (isHeicFile(file)) return false;
  return true;
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Impossible de lire cette image"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resize & re-encode photos before upload (faster upload, reliable preview in admin). */
export async function compressImageForUpload(file: File): Promise<File> {
  if (isHeicFile(file)) {
    throw new Error(HEIC_UPLOAD_MESSAGE);
  }
  if (!isCompressibleImage(file)) return file;
  if (file.size < SKIP_COMPRESS_BELOW_BYTES && !/\.(jpe?g|webp)$/i.test(file.name)) {
    // Still compress large-dimension small files
    if (file.size < 150_000) return file;
  }

  const img = await loadImageElement(file);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  if (scale === 1 && file.size < SKIP_COMPRESS_BELOW_BYTES && /\.jpe?g$/i.test(file.name)) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
  if (!blob) throw new Error("Échec de préparation de l’image");

  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]+/g, "_") || "image";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export async function prepareFilesForUpload(files: FileList | File[]): Promise<File[]> {
  const list = [...files];
  const prepared: File[] = [];
  for (const file of list) {
    if (file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name)) {
      prepared.push(file);
      continue;
    }
    prepared.push(await compressImageForUpload(file));
  }
  return prepared;
}

export function formatUploadSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
