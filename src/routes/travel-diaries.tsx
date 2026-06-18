import { createFileRoute } from "@tanstack/react-router";
import { JournalSection } from "@/components/lifestyle/JournalSection";
import { Reveal } from "@/components/lifestyle/Reveal";
import { useSiteContent } from "@/lib/content-context";

export const Route = createFileRoute("/travel-diaries")({
  head: () => ({
    meta: [
      { title: "Bingin Diaries Journal — Travel & Slow Living" },
      {
        name: "description",
        content: "Guides, beaches, cafés and travel stories from Bali — the Bingin Diaries journal.",
      },
    ],
  }),
  component: TravelDiariesPage,
});

function TravelDiariesPage() {
  const { homepage } = useSiteContent();
  const page = homepage.travelDiariesPage;

  return (
    <>
      <section className="page-wrap section-pad pt-20 md:pt-28 pb-12 md:pb-16 border-b border-border">
        <Reveal>
          <p className="text-eyebrow">{page.eyebrow}</p>
          <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.94] max-w-3xl">
            {page.title}
          </h1>
          <p className="text-caption mt-8 max-w-xl">{page.description}</p>
        </Reveal>
      </section>
      <JournalSection showHeader={false} />
    </>
  );
}
