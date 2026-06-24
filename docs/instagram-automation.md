# Instagram — automation

The site loads Instagram in three layers:

1. **Live** — `GET /api/instagram` calls Meta Graph API (token in Cloudflare secrets)
2. **Static cache** — `public/instagram-feed.json` + `public/instagram/*` (bundled on deploy)
3. **Fallback** — lifestyle photos if everything else fails

Visitors never run commands. Maintenance is automated via GitHub Actions.

---

## Daily behaviour (production)

With `INSTAGRAM_ACCESS_TOKEN` set in Cloudflare:

- Each page load fetches the latest posts from Instagram
- Known posts use local images from `/instagram/` (no expired CDN URLs)
- If the API is down, the static cache is served

---

## Weekly automation (GitHub Actions)

Workflow: [`.github/workflows/instagram-maintain.yml`](../.github/workflows/instagram-maintain.yml)

Every **Sunday 04:00 UTC** (or manual **Run workflow**):

1. Refresh the long-lived Meta token (~60 days → renewed)
2. Update Cloudflare secret `INSTAGRAM_ACCESS_TOKEN`
3. Update GitHub secret `INSTAGRAM_ACCESS_TOKEN` (if `GH_PAT` is set)
4. Run `npm run instagram:sync` — download new images locally
5. Commit updated assets to the repo
6. Deploy to Cloudflare Workers

---

## One-time GitHub setup

Add these **repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Required | Notes |
|--------|----------|-------|
| `INSTAGRAM_ACCESS_TOKEN` | Yes | Current long-lived token from Meta |
| `INSTAGRAM_USER_ID` | Optional | Instagram Business account ID |
| `CLOUDFLARE_API_TOKEN` | Yes | Workers Edit + Account Read |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `GH_PAT` | Recommended | Fine-grained PAT with **Secrets: Read and write** on this repo — keeps GitHub token in sync after refresh |

Create a Cloudflare API token: Dashboard → My Profile → API Tokens → **Edit Cloudflare Workers** template.

Create `GH_PAT`: GitHub → Settings → Developer settings → Fine-grained tokens → Repository access → this repo → Secrets: Read and write.

---

## Manual commands (developers only)

```bash
npm run instagram:sync              # Fetch posts + download images
npm run instagram:refresh           # Re-download images from existing feed file
npm run instagram:token-refresh     # Print new token (local)
npm run instagram:token-refresh -- --update-cloudflare   # Also update Cloudflare secret
```

---

## Token expiry

Instagram long-lived tokens expire after **~60 days**. The weekly workflow refreshes them automatically.

If automation fails and the token expires:

- The site still shows the **last synced** photos (static cache)
- Fix: regenerate a token in [Meta for Developers](https://developers.facebook.com/), update Cloudflare secret and GitHub secret, re-run the workflow manually

---

## Admin status

`/admin` dashboard → CMS status card shows Instagram source, post count, and whether a token is configured.

---

## Related docs

- [08-content-cms-and-design.md](./08-content-cms-and-design.md) — homepage Instagram grid layout (`gap-0`, full bleed)
- [06-deployment.md](./06-deployment.md) — `INSTAGRAM_ACCESS_TOKEN` secret
