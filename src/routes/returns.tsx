import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoPage } from "@/components/site/InfoPage";
import { useSiteContent } from "@/lib/content-context";
import { BRAND_CONTENT } from "@/data/brand-content";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "returns",
  title: BRAND_CONTENT.shippingReturns.returns.title,
  eyebrow: BRAND_CONTENT.shippingReturns.returns.eyebrow,
  metaDescription: "",
  body: BRAND_CONTENT.shippingReturns.returns.body,
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
