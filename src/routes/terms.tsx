import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";
import { useCmsPage } from "@/lib/use-cms-page";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "terms",
  title: "Terms & conditions",
  eyebrow: "Legal",
  metaDescription: "Terms and conditions for purchases on bingindiaries.com.",
  body: [
    "These terms apply to all orders placed on bingindiaries.com. By completing a purchase you agree to them.",
    "Prices are shown in EUR unless another currency is selected at checkout. Payment is processed securely via Stripe.",
    "We reserve the right to cancel an order in case of stock error, pricing mistake, or suspected fraud — you will be refunded in full.",
    "Products remain our property until payment is received in full. Risk passes to you upon delivery to the carrier.",
    "For returns, shipping, and privacy, see the linked policies in the footer. Questions: info@bingindiaries.com.",
    "French law applies. Any dispute shall be submitted to the competent courts in France, subject to mandatory consumer rights in your country of residence.",
  ],
};

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & conditions — Bingin Diaries" }] }),
  component: TermsPage,
});

function TermsPage() {
  const page = useCmsPage("terms", FALLBACK);

  return (
    <InfoPage eyebrow={page.eyebrow} title={page.title}>
      {page.body.map((p) => (
        <p key={p.slice(0, 32)}>{p}</p>
      ))}
    </InfoPage>
  );
}
