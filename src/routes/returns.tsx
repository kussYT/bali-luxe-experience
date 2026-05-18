import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "Returns — Bingin Diaries" }] }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <InfoPage eyebrow="Customer care" title="Returns">
      <p>Unworn pieces may be returned within 14 days of delivery. Items must be in original condition with tags attached.</p>
      <p>To start a return, contact us at hello@bingindiaries.com with your order number.</p>
      <p>Refunds are processed within 5–10 business days after we receive your return.</p>
    </InfoPage>
  );
}
