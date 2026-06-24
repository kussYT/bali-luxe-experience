import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";
import { useCmsPage } from "@/lib/use-cms-page";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "faq",
  title: "Frequently asked questions",
  eyebrow: "Customer care",
  metaDescription: "Answers to common questions about Bingin Diaries orders, sizing, and care.",
  body: [
    "How long does shipping take? Orders leave our atelier within 2–4 business days. Delivery is typically 3–7 days in Europe and 7–14 days internationally.",
    "Can I return a hat? Unworn pieces may be returned within 14 days. See our return policy or email info@bingindiaries.com with your order number.",
    "How do I choose a size? Each style fits differently — use our size guide or contact us with your head measurement and we will help.",
    "Are your hats really hand-woven? Yes. Each piece is woven by artisans we work with directly in Bali, with finishing in France.",
    "Still have a question? Write to info@bingindiaries.com — we reply within one business day.",
  ],
};

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — Bingin Diaries" }] }),
  component: FaqPage,
});

function FaqPage() {
  const page = useCmsPage("faq", FALLBACK);

  return (
    <InfoPage eyebrow={page.eyebrow} title={page.title}>
      {page.body.map((p) => (
        <p key={p.slice(0, 32)}>{p}</p>
      ))}
    </InfoPage>
  );
}
