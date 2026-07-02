import { prepareFilesForUpload, formatUploadSize } from "@/lib/prepare-upload-files";

export type UploadProgress = {
  phase: "preparing" | "uploading";
  current: number;
  total: number;
  fileName?: string;
};

export async function uploadAdminFiles(
  slug: string,
  files: FileList | File[],
  onProgress?: (progress: UploadProgress) => void,
) {
  onProgress?.({ phase: "preparing", current: 0, total: files.length });
  const prepared = await prepareFilesForUpload(files);
  const urls: string[] = [];

  for (let i = 0; i < prepared.length; i++) {
    const file = prepared[i];
    onProgress?.({
      phase: "uploading",
      current: i + 1,
      total: prepared.length,
      fileName: `${file.name} (${formatUploadSize(file.size)})`,
    });

    const form = new FormData();
    form.append("images", file);
    const res = await fetch(`/api/admin/upload?slug=${encodeURIComponent(slug)}`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Échec de l’envoi");
    if (Array.isArray(data.urls)) urls.push(...data.urls);
  }

  return { urls };
}
