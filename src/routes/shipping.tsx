import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InfoPage } from "@/components/site/InfoPage";
import { useSiteContent } from "@/lib/content-context";
import type { CmsPage } from "@/lib/content-types";

const FALLBACK: CmsPage = {
  slug: "shipping",
  title: "Shipping",
  eyebrow: "Customer care",
  metaDescription: "",
  body: [
    "We ship worldwide from our ateliers in Canggu and Paris. Orders are dispatched within 2–4 business days.",
    "Delivery times vary by destination — typically 3–7 days within Europe, 7–14 days internationally.",
    "You'll receive tracking details by email once your order leaves the atelier.",
  ],
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
