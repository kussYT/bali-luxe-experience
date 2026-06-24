import { useEffect, useState } from "react";
import { useSiteContent } from "@/lib/content-context";
import type { CmsPage } from "@/lib/content-types";

export function useCmsPage(slug: string, fallback: CmsPage) {
  const { fetchPage } = useSiteContent();
  const [page, setPage] = useState<CmsPage>(fallback);

  useEffect(() => {
    fetchPage(slug).then((p) => {
      if (p) setPage(p);
    });
  }, [fetchPage, slug]);

  return page;
}
