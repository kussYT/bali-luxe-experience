import { LOCALES, useLocale } from "@/lib/i18n/locale-context";
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
  const triggerClass =
    variant === "footer"
      ? "border-surface/20 bg-transparent text-surface/85 h-9 text-[0.6875rem] tracking-[0.18em] uppercase"
      : "border-transparent bg-transparent h-9 text-[0.6875rem] tracking-[0.18em] uppercase text-foreground/80 shadow-none";

  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as typeof locale)}>
      <SelectTrigger className={triggerClass} aria-label="Language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
