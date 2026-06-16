# Sprint S4 — Emails & ops

Transactional email via [Resend](https://resend.com). Without `RESEND_API_KEY`, emails are logged to the server console (safe for local dev).

## Environment variables

Add to `.env.local`:

```env
# Transactional email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Bingin Diaries <hello@bingindiaries.com>
EMAIL_OPS=ops@bingindiaries.com

# Newsletter (optional — already supported)
NEWSLETTER_PROVIDER=brevo
BREVO_API_KEY=...
BREVO_LIST_ID=...
```

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (production) |
| `EMAIL_FROM` | Sender address (must be verified in Resend) |
| `EMAIL_OPS` | Inbox for contact form messages |
| `NEWSLETTER_PROVIDER` | `local` (default) or `brevo` for newsletter signups |

## Migration

```bash
npm run db:migrate
```

Applies `003_order_shipped.sql` (`shipped` status + `shipped_at` column).

## Features

### Order confirmation
Sent automatically when Stripe webhook marks an order as `paid`.

### Shipped notification
1. Open `/admin/orders/:id`
2. Click **Mark as shipped** (paid orders only)
3. Customer receives shipped email; order status → `shipped`

### Contact form
`POST /api/contact` — wired on `/contact` page. Delivers to `EMAIL_OPS`.

### CSV export
`/admin/orders` → **Export CSV** (admin session required).

## Local testing

Without Resend, complete a test checkout and check the dev server terminal:

```
[email] (no RESEND_API_KEY — console only)
  to: customer@example.com
  subject: Order confirmed — Bingin Diaries
```

With Resend: verify domain/sender in Resend dashboard, then use test checkout or contact form.
