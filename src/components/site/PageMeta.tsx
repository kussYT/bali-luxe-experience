import { useEffect } from "react";

type PageMetaProps = {
  title: string;
  description?: string;
};

/** Updates document title + meta description (client-side, CMS-driven pages). */
export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    if (!description?.trim()) return;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    el.setAttribute("content", description.trim());
  }, [title, description]);

  return null;
}
