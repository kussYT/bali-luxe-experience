import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND_CONTENT } from "@/data/brand-content";

const { sizing } = BRAND_CONTENT;

export const Route = createFileRoute("/sizing")({
  head: () => ({
    meta: [
      { title: "Guide des tailles — Bingin Diaries" },
      { name: "description", content: "Tailles et ajustements des chapeaux Bingin Diaries." },
    ],
  }),
  component: SizingPage,
});

function SizingPage() {
  return (
    <section className="page-wrap section-pad py-24 max-w-4xl">
      <p className="text-eyebrow text-muted-foreground">{sizing.eyebrow}</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">{sizing.title}</h1>
      <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed max-w-2xl">
        {sizing.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      {sizing.image && (
        <img
          src={sizing.image}
          alt="Bingin Diaries size guide"
          className="mt-12 w-full max-w-3xl image-editorial"
          loading="lazy"
        />
      )}

      <p className="mt-16 text-sm">
        <Link to="/about" className="link-underline">
          ← Retour à la marque
        </Link>
      </p>
    </section>
  );
}
