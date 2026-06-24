import { useEffect, useState } from "react";
import { useSiteContent } from "@/lib/content-context";
import { useLocale } from "@/lib/i18n/locale-context";
import type { CmsPage } from "@/lib/content-types";

export function useCmsPage(slug: string, fallback: CmsPage) {
  const { fetchPage } = useSiteContent();
  const { locale } = useLocale();
  const [page, setPage] = useState<CmsPage>(fallback);

  useEffect(() => {
    fetchPage(slug, locale).then((p) => {
      if (p) setPage(p);
      else setPage(fallback);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback is stable per route
  }, [fetchPage, slug, locale]);

  return page;
}
