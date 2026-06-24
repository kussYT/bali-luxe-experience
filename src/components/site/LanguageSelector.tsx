import { LOCALES, useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";
import { localeFlag } from "@/lib/locale-market";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageSelectorProps = {
  variant?: "header" | "footer";
};

function Flag({ locale }: { locale: Locale }) {
  return (
    <span className="text-lg leading-none" role="img" aria-hidden>
      {localeFlag(locale)}
    </span>
  );
}

export function LanguageSelector({ variant = "header" }: LanguageSelectorProps) {
  const { locale, setLocale } = useLocale();
  const triggerClass =
    variant === "footer"
      ? "border-surface/20 bg-transparent text-surface/85 h-9 w-11 px-0 justify-center"
      : "border-transparent bg-transparent h-9 w-11 px-0 justify-center shadow-none";

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className={triggerClass} aria-label={current ? `Language: ${current.label}` : "Language"}>
        <SelectValue>
          <Flag locale={locale} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((item) => (
          <SelectItem key={item.code} value={item.code} aria-label={item.label}>
            <span className="flex items-center gap-2">
              <Flag locale={item.code as Locale} />
              <span className="text-xs uppercase tracking-wider">{item.code}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
