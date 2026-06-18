import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoPage } from "@/components/site/InfoPage";
import { useSiteContent } from "@/lib/content-context";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "returns",
  title: "Returns",
  eyebrow: "Customer care",
  metaDescription: "",
  body: [
    "Unworn pieces may be returned within 14 days of delivery. Items must be in original condition with tags attached.",
    "To start a return, contact us at hello@bingindiaries.com with your order number.",
    "Refunds are processed within 5–10 business days after we receive your return.",
  ],
};

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — Bingin Diaries" }] }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const { fetchPage } = useSiteContent();
  const [page, setPage] = useState<CmsPage>(FALLBACK);

  useEffect(() => {
    fetchPage("returns").then((p) => {
      if (p) setPage(p);
    });
  }, [fetchPage]);

  return (
    <InfoPage eyebrow={page.eyebrow} title={page.title}>
      {page.body.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
    </InfoPage>
  );
}
