import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({ meta: [{ title: "Shipping — Bingin Diaries" }] }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <InfoPage eyebrow="Customer care" title="Shipping">
      <p>We ship worldwide from our ateliers in Canggu and Paris. Orders are dispatched within 2–4 business days.</p>
      <p>Delivery times vary by destination — typically 3–7 days within Europe, 7–14 days internationally.</p>
      <p>You'll receive tracking details by email once your order leaves the atelier.</p>
    </InfoPage>
  );
}
