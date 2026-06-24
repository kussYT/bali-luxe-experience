import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";
import { useCmsPage } from "@/lib/use-cms-page";
import type { CmsPage } from "@/lib/content-types";
import { BRAND_CONTENT } from "@/data/brand-content";

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
  const page = useCmsPage("returns", FALLBACK);

  return (
    <InfoPage eyebrow={page.eyebrow} title={page.title}>
      {page.body.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
    </InfoPage>
  );
}
