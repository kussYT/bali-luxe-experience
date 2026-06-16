import { useState, type FormEvent } from "react";
import { isValidEmailInput, subscribeNewsletter } from "@/lib/newsletter";

type NewsletterFormProps = {
  source?: string;
  variant?: "footer" | "section";
};

export function NewsletterForm({ source = "website", variant = "footer" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isSection = variant === "section";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmailInput(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await subscribeNewsletter(email, source);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    setStatus("success");
    setMessage(
      result.duplicate
        ? "You're already on the list — thank you for staying close."
        : "Welcome to the diary. Check your inbox soon.",
    );
    setEmail("");
  }

  if (isSection) {
    return (
      <div className="page-wrap section-pad py-20 md:py-28 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-eyebrow">Newsletter</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 leading-[1.05]">
            Join the diary
          </h2>
          <p className="text-caption mt-5 max-w-md mx-auto">
            Receive notes from Bali, new drops and summer stories.
          </p>
          <NewsletterFields
            email={email}
            setEmail={setEmail}
            status={status}
            message={message}
            onSubmit={handleSubmit}
            className="mt-10"
            inputClass="text-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-eyebrow !text-surface/50">Newsletter</p>
      <h2 className="font-display text-4xl md:text-5xl mt-4 mb-8 leading-[1.05] max-w-md">
        Join the diary
      </h2>
      <p className="text-sm text-surface/60 font-light mb-6 max-w-md">
        Receive notes from Bali, new drops and summer stories.
      </p>
      <NewsletterFields
        email={email}
        setEmail={setEmail}
        status={status}
        message={message}
        onSubmit={handleSubmit}
        dark
      />
    </div>
  );
}

function NewsletterFields({
  email,
  setEmail,
  status,
  message,
  onSubmit,
  className = "",
  inputClass = "",
  dark = false,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: "idle" | "loading" | "success" | "error";
  message: string;
  onSubmit: (e: FormEvent) => void;
  className?: string;
  inputClass?: string;
  dark?: boolean;
}) {
  const border = dark ? "border-surface/25" : "border-border";
  const text = dark ? "text-surface placeholder:text-surface/40" : "text-foreground placeholder:text-muted-foreground";
  const btn = dark ? "!text-accent-soft" : "";

  return (
    <form
      className={`flex flex-col sm:flex-row border-b ${border} pb-3 max-w-md gap-4 mx-auto ${className}`}
      onSubmit={onSubmit}
    >
      <div className="flex-1 w-full">
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          placeholder="Your email"
          aria-invalid={status === "error"}
          aria-describedby={message ? "newsletter-status" : undefined}
          className={`bg-transparent w-full outline-none text-sm font-light disabled:opacity-50 ${text} ${inputClass}`}
        />
        {message && (
          <p
            id="newsletter-status"
            role="status"
            className={`text-xs mt-3 ${status === "error" ? "text-red-400" : dark ? "text-surface/70" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className={`text-eyebrow link-underline shrink-0 disabled:opacity-50 ${btn}`}
      >
        {status === "loading" ? "Sending…" : "Subscribe"}
      </button>
    </form>
  );
}
