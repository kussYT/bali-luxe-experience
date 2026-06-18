import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoPage } from "@/components/site/InfoPage";
import { useSiteContent } from "@/lib/content-context";
import { BRAND_CONTENT } from "@/data/brand-content";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "shipping",
  title: BRAND_CONTENT.shippingReturns.shipping.title,
  eyebrow: BRAND_CONTENT.shippingReturns.shipping.eyebrow,
  metaDescription: "",
  body: BRAND_CONTENT.shippingReturns.shipping.body,
};

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — Bingin Diaries" }] }),
  component: ShippingPage,
});

function ShippingPage() {
  const { fetchPage } = useSiteContent();
  const [page, setPage] = useState<CmsPage>(FALLBACK);

  useEffect(() => {
    fetchPage("shipping").then((p) => {
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
