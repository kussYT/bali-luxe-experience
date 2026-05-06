import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bing in Diaries" },
      { name: "description", content: "Talk to the atelier in Canggu or Paris." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section className="px-6 md:px-14 py-24 grid md:grid-cols-2 gap-16 max-w-7xl">
      <div>
        <p className="text-eyebrow text-muted-foreground">Get in touch</p>
        <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">
          Write to us.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
          For special orders, press, wholesale, or simply to say hello — we read every message.
        </p>

        <div className="mt-12 space-y-8">
          <div>
            <p className="text-eyebrow text-muted-foreground mb-2">Bali — Atelier</p>
            <p className="font-display text-2xl">Jl. Pantai Batu Bolong, Canggu</p>
            <p className="text-sm text-muted-foreground mt-1">canggu@bingindiaries.com</p>
          </div>
          <div>
            <p className="text-eyebrow text-muted-foreground mb-2">Paris — Studio</p>
            <p className="font-display text-2xl">12 rue de Sévigné, 75004</p>
            <p className="text-sm text-muted-foreground mt-1">paris@bingindiaries.com</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        className="space-y-6"
      >
        {(["Name", "Email", "Subject"] as const).map((l) => (
          <div key={l}>
            <label className="text-eyebrow text-muted-foreground">{l}</label>
            <input
              required
              type={l === "Email" ? "email" : "text"}
              className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition"
            />
          </div>
        ))}
        <div>
          <label className="text-eyebrow text-muted-foreground">Message</label>
          <textarea required rows={5} className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition resize-none" />
        </div>
        <button type="submit" className="bg-ink text-bone px-10 py-4 text-eyebrow hover:bg-clay transition-colors">
          {sent ? "Message sent — merci" : "Send message"}
        </button>
      </form>
    </section>
  );
}
