import { createFileRoute } from "@tanstack/react-router";
import { JournalSection } from "@/components/lifestyle/JournalSection";
import { Reveal } from "@/components/lifestyle/Reveal";

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
  return (
    <>
      <section className="page-wrap section-pad pt-20 md:pt-28 pb-12 md:pb-16 border-b border-border">
        <Reveal>
          <p className="text-eyebrow">Bingin Diaries Journal</p>
          <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.94] max-w-3xl">
            Slow notes from Bali & beyond
          </h1>
          <p className="text-caption mt-8 max-w-xl">
            Plages, cafés, moodboards et looks — une dimension lifestyle pour voyager avec la maison.
          </p>
        </Reveal>
      </section>
      <JournalSection showHeader={false} />
    </>
  );
}
