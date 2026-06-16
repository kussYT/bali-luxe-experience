import { sendEmail, opsInbox } from "../email.mjs";

export async function sendContactEmail({ name, email, subject, message }) {
  const safeName = String(name || "").trim().slice(0, 120);
  const safeEmail = String(email || "").trim().slice(0, 254);
  const safeSubject = String(subject || "").trim().slice(0, 200);
  const safeMessage = String(message || "").trim().slice(0, 5000);

  if (!safeName || !safeEmail || !safeMessage) {
    const err = new Error("Name, email and message are required");
    err.status = 400;
    throw err;
  }

  const html = `
    <p><strong>From:</strong> ${escapeHtml(safeName)} &lt;${escapeHtml(safeEmail)}&gt;</p>
    <p><strong>Subject:</strong> ${escapeHtml(safeSubject || "(no subject)")}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
    <p style="white-space:pre-wrap;">${escapeHtml(safeMessage)}</p>
  `;

  return sendEmail({
    to: opsInbox(),
    replyTo: safeEmail,
    subject: `[Contact] ${safeSubject || safeName}`,
    html,
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
