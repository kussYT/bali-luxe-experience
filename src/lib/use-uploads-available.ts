import { useEffect, useState } from "react";
import { fetchAdminCmsStatus } from "@/lib/admin-api";

export const UPLOADS_UNAVAILABLE_MESSAGE = "Media uploads not available until R2 is enabled";

let cached: boolean | null = null;
let pending: Promise<boolean> | null = null;

function isUploadsModeAvailable(mode: string | undefined) {
  return mode === "r2" || mode === "filesystem";
}

export async function checkUploadsAvailable() {
  if (cached !== null) return cached;
  if (!pending) {
    pending = fetchAdminCmsStatus()
      .then((status) => {
        cached = isUploadsModeAvailable(status.uploads);
        return cached;
      })
      .catch(() => false)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

/** Whether admin file uploads work in this environment (R2 prod or local disk). */
export function useUploadsAvailable() {
  const [available, setAvailable] = useState<boolean | null>(cached);

  useEffect(() => {
    checkUploadsAvailable().then(setAvailable);
  }, []);

  return {
    available: available === true,
    loading: available === null,
  };
}
