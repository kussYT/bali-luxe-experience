import { UPLOADS_UNAVAILABLE_MESSAGE } from "@/lib/use-uploads-available";

type UploadsUnavailableBannerProps = {
  /** Extra hint shown below the main message. */
  hint?: string;
};

export function UploadsUnavailableBanner({ hint }: UploadsUnavailableBannerProps) {
  return (
    <div
      role="status"
      className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <p>{UPLOADS_UNAVAILABLE_MESSAGE}</p>
      {hint && <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">{hint}</p>}
    </div>
  );
}
