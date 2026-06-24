import * as FlagIcons from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

type CountryFlagProps = {
  code: string;
  className?: string;
  title?: string;
};

/** 3:2 SVG flag — renders correctly on Windows (unlike emoji flags). */
export function CountryFlag({ code, className, title }: CountryFlagProps) {
  const iso = code.toUpperCase();
  const Flag = FlagIcons[iso as keyof typeof FlagIcons];
  if (!Flag) {
    return (
      <span
        className={cn("inline-flex items-center justify-center text-xs", className)}
        title={title}
        aria-hidden={!title}
      >
        🌐
      </span>
    );
  }
  return (
    <Flag
      className={cn(
        "inline-block w-[1.25rem] h-[0.833rem] shrink-0 rounded-[2px] object-cover shadow-sm",
        className,
      )}
      title={title}
      aria-hidden={!title}
    />
  );
}
