import { CMS_LOCALES, emptyNavigationLocaleFields } from "@/lib/i18n/cms-locales";
import type { Locale } from "@/lib/i18n/messages";
import type { SiteNavigationLocaleFields, SiteNavigationStored } from "@/lib/content-types";
import { CmsField } from "@/components/admin/CmsField";

type Props = {
  stored: SiteNavigationStored;
  activeLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onChange: (locales: NonNullable<SiteNavigationStored["locales"]>) => void;
};

function localeFields(stored: SiteNavigationStored, code: Locale): SiteNavigationLocaleFields {
  return stored.locales?.[code] || emptyNavigationLocaleFields();
}

export function NavigationLocaleEditor({ stored, activeLocale, onLocaleChange, onChange }: Props) {
  const fields = localeFields(stored, activeLocale);

  const patch = (patchFields: Partial<SiteNavigationLocaleFields>) => {
    const current = localeFields(stored, activeLocale);
    onChange({
      ...stored.locales,
      [activeLocale]: { ...current, ...patchFields },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CMS_LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => onLocaleChange(l.code)}
            className={`px-3 py-1.5 text-xs border ${activeLocale === l.code ? "border-foreground bg-muted" : "border-border"}`}
          >
            {l.adminLabel}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CmsField
          label={`New Collection (${activeLocale})`}
          value={fields.newCollection}
          onChange={(v) => patch({ newCollection: v })}
        />
        <CmsField
          label={`Shop (${activeLocale})`}
          value={fields.shop}
          onChange={(v) => patch({ shop: v })}
        />
        <CmsField
          label={`Sales (${activeLocale})`}
          value={fields.sales}
          onChange={(v) => patch({ sales: v })}
        />
        <CmsField
          label={`About us (${activeLocale})`}
          value={fields.aboutUs}
          onChange={(v) => patch({ aboutUs: v })}
        />
        <div className="sm:col-span-2">
          <CmsField
            label={`Recherches populaires (${activeLocale}, séparées par des virgules)`}
            value={(fields.popularSearches ?? []).join(", ")}
            onChange={(v) =>
              patch({
                popularSearches: v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Ces libellés remplacent les titres du menu principal selon la langue du site.
      </p>
    </div>
  );
}
