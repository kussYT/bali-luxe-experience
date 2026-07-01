import { useEffect, useState } from "react";
import { useSiteContent } from "@/lib/content-context";
import { useLocale } from "@/lib/i18n/locale-context";
import type { JournalPost } from "@/lib/content-types";

export function useCmsPost(slug: string, fallback: JournalPost | null = null) {
  const { fetchPost } = useSiteContent();
  const { locale } = useLocale();
  const [post, setPost] = useState<JournalPost | null | undefined>(undefined);

  useEffect(() => {
    setPost(undefined);
    fetchPost(slug, locale).then((p) => {
      setPost(p ?? fallback);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fallback is stable per route
  }, [fetchPost, slug, locale]);

  return post;
}
