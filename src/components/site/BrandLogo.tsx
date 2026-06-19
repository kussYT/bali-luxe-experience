import { Link } from "@tanstack/react-router";

type BrandLogoProps = {
  /** `header` — nav center; `footer` — inverted on dark bg; `compact` — mark only (mobile drawer) */
  variant?: "header" | "footer" | "compact";
  className?: string;
};

/** Bingin Diaries wordmark + double-apostrophe mark (from Shopify). */
export function BrandLogo({ variant = "header", className = "" }: BrandLogoProps) {
  const mark = (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      className={`object-contain object-center ${
        variant === "footer"
          ? "h-[1.125rem] sm:h-5 brightness-0 invert"
          : variant === "compact"
            ? "h-4 w-auto mix-blend-multiply"
            : "h-[0.875rem] sm:h-4 md:h-[1.125rem] w-auto mix-blend-multiply"
      }`}
    />
  );

  if (variant === "compact") {
    return (
      <Link to="/" aria-label="Bingin Diaries" className={`inline-flex ${className}`}>
        {mark}
      </Link>
    );
  }

  return (
    <Link
      to="/"
      aria-label="Bingin Diaries"
      className={`inline-flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 text-center ${className}`}
    >
      {mark}
      <span
        className={`font-display leading-none tracking-[0.06em] whitespace-nowrap ${
          variant === "footer"
            ? "text-surface text-lg sm:text-xl"
            : "text-foreground text-[0.8125rem] sm:text-[1.125rem] md:text-[1.375rem] lg:text-[1.5rem]"
        }`}
      >
        Bingin Diaries
      </span>
    </Link>
  );
}
