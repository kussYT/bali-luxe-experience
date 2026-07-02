import { CountryFlag } from "@/components/site/CountryFlag";
import { LOCALES, useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/messages";
import { LOCALE_FLAG_COUNTRY } from "@/lib/locale-market";
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

export function LanguageSelector({ variant = "header" }: LanguageSelectorProps) {
  const { locale, setLocale } = useLocale();
  const current = LOCALES.find((l) => l.code === locale);
  const ariaLabel = current ? `Language: ${current.label}` : "Language";

  const triggerClass =
    variant === "footer"
      ? "border-surface/20 bg-transparent text-surface/85 h-9 gap-2 px-2"
      : "border-transparent bg-transparent shadow-none h-9 w-9 px-0 justify-center gap-0 [&>svg]:hidden";

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger className={triggerClass} aria-label={ariaLabel} title={ariaLabel}>
        <SelectValue aria-label={ariaLabel}>
          <CountryFlag code={LOCALE_FLAG_COUNTRY[locale]} className="!w-[1.35rem] !h-[0.9rem]" />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {LOCALES.map((item) => (
          <SelectItem key={item.code} value={item.code} textValue={item.label}>
            <span className="flex items-center gap-2">
              <CountryFlag code={LOCALE_FLAG_COUNTRY[item.code as Locale]} className="shrink-0" />
              <span>{item.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
