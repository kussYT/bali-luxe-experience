import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoPage } from "@/components/site/InfoPage";

export const Route = createFileRoute("/travel-diaries")({
  head: () => ({ meta: [{ title: "Travel Diaries — Bingin Diaries" }] }),
  component: TravelDiariesPage,
});

function TravelDiariesPage() {
  return (
    <InfoPage eyebrow="Journal" title="Travel Diaries">
      <p>Slow notes from the road — between rice fields, limestone cliffs, and quiet mornings by the sea.</p>
      <p>Follow along on Instagram for the latest chapters from our two homes.</p>
      <p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="link-underline text-ink">
          @bingindiaries
        </a>
      </p>
      <p>
        <Link to="/about" className="link-underline text-ink">
          Read about the atelier →
        </Link>
      </p>
    </InfoPage>
  );
}
