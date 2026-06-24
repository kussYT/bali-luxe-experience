import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";
import { useCmsPage } from "@/lib/use-cms-page";
import type { CmsPage } from "@/lib/content-types";
import { BRAND_CONTENT } from "@/data/brand-content";

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
  const page = useCmsPage("shipping", FALLBACK);

  return (
    <InfoPage eyebrow={page.eyebrow} title={page.title}>
      {page.body.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
    </InfoPage>
  );
}
