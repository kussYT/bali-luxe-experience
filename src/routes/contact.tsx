import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { sendContactMessage } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Bingin Diaries" },
      { name: "description", content: "Write to the Bingin Diaries team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await sendContactMessage({ name, email, subject, message });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <section className="page-wrap section-pad py-24 grid md:grid-cols-2 gap-16 max-w-7xl bg-white">
      <div>
        <p className="text-eyebrow text-muted-foreground">Get in touch</p>
        <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">
          Write to us.
        </h1>
        <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
          For special orders, press, wholesale, or simply to say hello — we read every message.
        </p>

        <div className="mt-12">
          <p className="text-eyebrow text-muted-foreground mb-2">Email</p>
          <a href="mailto:info@bingindiaries.com" className="font-display text-2xl link-underline">
            info@bingindiaries.com
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-eyebrow text-muted-foreground">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition"
          />
        </div>
        <div>
          <label className="text-eyebrow text-muted-foreground">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition"
          />
        </div>
        <div>
          <label className="text-eyebrow text-muted-foreground">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition"
          />
        </div>
        <div>
          <label className="text-eyebrow text-muted-foreground">Message</label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mt-2 bg-transparent border-b border-border py-3 outline-none focus:border-ink transition resize-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading || sent}
          className="bg-ink text-bone px-10 py-4 text-eyebrow hover:bg-clay transition-colors disabled:opacity-50"
        >
          {sent ? "Message sent — merci" : loading ? "Sending…" : "Send message"}
        </button>
      </form>
    </section>
  );
}
