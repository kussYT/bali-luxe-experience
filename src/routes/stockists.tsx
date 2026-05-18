import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/stockists")({
  head: () => ({ meta: [{ title: "Stockists — Bingin Diaries" }] }),
  component: StockistsPage,
});

function StockistsPage() {
  return (
    <InfoPage eyebrow="Find us" title="Stockists">
      <p>Bingin Diaries is available at select boutiques across France, Bali, and the Mediterranean coast.</p>
      <p>Paris — Le Marais · Cassis — Vieux Port · Canggu — Batu Bolong</p>
      <p>For wholesale enquiries, please reach out via our contact page.</p>
    </InfoPage>
  );
}
