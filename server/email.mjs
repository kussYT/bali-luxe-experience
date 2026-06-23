/**
 * Transactional email via Resend (https://resend.com).
 * Without RESEND_API_KEY, logs to console (safe for local dev).
 */

function emailFrom() {
  return process.env.EMAIL_FROM?.trim() || "Bingin Diaries <info@bingindiaries.com>";
}

function opsInbox() {
  return process.env.EMAIL_OPS?.trim() || process.env.CONTACT_TO?.trim() || "info@bingindiaries.com";
}

export function formatMoneyEmail(amount, currency) {
  if (amount == null) return "—";
  if (currency === "IDR") return `Rp ${Number(amount).toLocaleString("en-US")}`;
  const value = Number(amount) / 100;
  if (currency === "USD") return `$${value.toFixed(2)}`;
  return `€${value.toFixed(2)}`;
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, "");
}

export { opsInbox };

export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const recipients = Array.isArray(to) ? to : [to];

  if (!apiKey) {
    console.log("[email] (no RESEND_API_KEY — console only)");
    console.log(`  to: ${recipients.join(", ")}`);
    console.log(`  subject: ${subject}`);
    return { ok: true, provider: "console" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: recipients,
      subject,
      html,
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Resend API error (${res.status}): ${text.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  return { ok: true, provider: "resend" };
}
