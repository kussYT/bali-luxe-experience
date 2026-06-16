import { sendContactEmail } from "../emails/contact-email.mjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function postContactMessage(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    const err = new Error("Name, email and message are required");
    err.status = 400;
    throw err;
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    const err = new Error("Invalid email address");
    err.status = 400;
    throw err;
  }

  await sendContactEmail({ name, email, subject, message });
  return { ok: true };
}
