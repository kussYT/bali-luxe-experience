# Content CMS & premium design (June 2026)

Living guide for the **public storefront design**, **editorial CMS**, and **Beatrice self-service workflow**.

**Staging:** https://bingin-diaries.bingindiaries-d08.workers.dev  
**Branch:** `design/premium-lifestyle`

---

## Summary

| Area | What changed |
|------|----------------|
| Visual | White background site-wide; minimal fashion product cards |
| Homepage | Hero video → 3 portrait photo tiles → products → Instagram |
| Collection | Scoped sub-filters inside a collection; Mi Paradisio fully synced |
| Instagram grid | Full-bleed, no gaps between images (matches photo strip) |
| CMS | Homepage, About, Find us editable in admin |
| Media upload | Hero / photo strip / About images via **Uploader un fichier** |
| Find us | Atlist map embed + editable stockist list |

---

## URLs (staging)

| Page | URL |
|------|-----|
| Public site | https://bingin-diaries.bingindiaries-d08.workers.dev |
| Admin login | https://bingin-diaries.bingindiaries-d08.workers.dev/admin/login |
| Content — Homepage | `/admin/content` |
| Content — About | `/admin/content/about` |
| Content — Find us | `/admin/content/find-us` |
| Products | `/admin/products` |
| Blog / Travel Diaries | `/admin/blog` |
| Info pages (shipping, returns) | `/admin/pages` |

---

## Homepage layout

Order on `/` (see `src/routes/index.tsx`):

1. **CinematicHero** — full-screen hero (video + poster)
2. **HomePhotoStrip** — 3 equal portrait columns, full bleed, no gaps
3. **Featured products** — curated grid from catalog
4. **InstagramSection** — live/static Instagram feed

Removed from homepage (legacy): editorial strip, lookbook chapters, craft section, quote block (data still in CMS for future use).

---

## Hero: photo vs video

Component: `src/components/lifestyle/CinematicHero.tsx`  
CMS fields: `homepage.hero.poster` and `homepage.hero.videoSrc`

| Field (admin) | Role |
|---------------|------|
| **Image poster** | Always loaded as background `<img>`; fallback if video fails |
| **Vidéo** | `<video>` layer on top when URL is set and file loads |

**Behaviour:**

1. Poster image is shown immediately.
2. If `videoSrc` is set, MP4 loads on top (poster used as `poster=` attribute while buffering).
3. When video is ready (`onCanPlay`), image fades out → video visible.
4. If video errors (`onError`), only the poster remains.

**Beatrice workflow:**

- **Video + photo:** fill both (recommended — graceful fallback + fast first paint).
- **Photo only:** set poster, **clear** the video field.
- **Never leave poster empty** if a video is set.

Formats: JPG/PNG/WebP (poster), MP4 (video).

---

## Home photo strip

Component: `src/components/lifestyle/HomePhotoStrip.tsx`  
CMS: `homepage.photoStrip` in `/admin/content`

- Layout `grid`: 2–3 portrait tiles, equal width, `gap-0`, ~72–96vh height
- Each tile: label, image, link (`href` + optional `search.c` for collection slug)
- Default tiles: Mi Paradisio, Sunburn, The Rimba

Upload images via **Uploader un fichier** → stored under `/uploads/cms/photo-strip-N/`.

---

## Instagram section

Component: `src/components/lifestyle/InstagramSection.tsx`

- Grid: `grid-cols-2 md:grid-cols-3`, **`gap-0`**, full viewport width (matches photo strip)
- Header/footer text in `page-wrap`; images edge-to-edge
- Feed: live API → static cache → fallback (see [instagram-automation.md](./instagram-automation.md))

**Beatrice:** no action needed — posts sync automatically.

---

## Collection page

Route: `/collection` · `src/routes/collection.tsx`

### Global view (no collection selected)

Filter bar: **All** + collection names + **Accessories** + **Bags**.

### Inside a collection (`?c=mi-paradisio-collection`)

Filter bar switches to **scoped sub-filters**:

- **All** — all products in this collection
- **Sub-collections** — other collection slugs shared by products (e.g. Special Occasions)
- **Categories** — Accessories / Hats / Bags (only if products exist in that collection)
- **All collections** — back to global view

Additional query params: `cat`, `sub`, `sale`, `q`.

Empty state uses readable `text-muted-foreground` and links back to the full collection when a sub-filter returns nothing.

### Mi Paradisio catalog

Shopify has ~13 products in `mi-paradisio-collection`. After import:

```bash
npm run catalog:import      # download images + regenerate catalog.json
npm run db:seed-catalog     # push to Postgres
npm run deploy
```

Verify: `GET /api/catalog` → filter products with `collectionSlug` or `collectionSlugs` containing `mi-paradisio-collection`.

---

## Navigation

Config: `src/lib/navigation.ts`, `src/components/site/Header.tsx`

| Item | Notes |
|------|-------|
| **New Collection** | Mi Paradisio 2026, New Accessories (`?c=mi-paradisio-collection&cat=accessories`), Special Occasions |
| **Shop** | All collections + Accessories + Bags |
| **Sales** | Dynamic from on-sale products |
| **About us** | Full-width hover band (`NavAboutBand`) — not a small dropdown |

Logo: `public/logo-mark.png` (transparent PNG). Favicon: `public/favicon.png`.

---

## Find us page

Route: `/find-us` · `src/components/site/FindUsPage.tsx`

- **Atlist** embed (store locator map) — URLs editable in CMS
- Optional **stockist list** by country/region (toggle `showStockistList`)
- Wholesale block (email + CTA)

Default Atlist URLs: `src/data/atlist.ts` (override with `VITE_ATLIST_EMBED_URL` at build time).

CMS: `/admin/content/find-us`.

---

## About page

Route: `/about` · `src/routes/about.tsx`

- YouTube embed (`youtubeId`)
- Text sections with anchor IDs (`#vision`, `#artisans`, `#quality`, …)
- Values row (3 columns)
- **Explore** sidebar: clickable photo tiles (desktop sticky + mobile grid)

CMS: `/admin/content/about` — sections, values, sidebar links (with image upload).

Nav links in page body still use `NAV_ABOUT` from `navigation.ts` (not CMS).

---

## CMS architecture

### Storage

Site editorial content is stored in Postgres `site_settings` (via `server/db/settings-store.mjs`) or `data/site-settings.json` when no DB.

Keys:

| Key | Content |
|-----|---------|
| `announcement` | Marquee banner |
| `homepage` | Hero, photo strip, Spotify, travel diaries copy, … |
| `about` | Full About page structure |
| `findUs` | Find us page structure |

Defaults: `server/content-defaults.mjs` (merged on read if fields missing).  
Client fallbacks: `src/lib/cms-fallbacks.ts`.

### Public API

| Endpoint | Response |
|----------|----------|
| `GET /api/content/site` | `{ announcement, homepage, about, findUs }` |
| `GET /api/content/posts` | Published blog posts |
| `GET /api/content/pages/:slug` | Info pages (shipping, returns, …) |

Loaded by `ContentProvider` (`src/lib/content-context.tsx`).

### Admin API

| Endpoint | Action |
|----------|--------|
| `GET /api/admin/content/site` | Read merged CMS state |
| `PATCH /api/admin/content/site` | Partial update (`announcement`, `homepage`, `about`, `findUs`) |
| `POST /api/admin/content/seed` | Import default posts/pages + seed empty settings |

### Admin UI routes

| Route | File |
|-------|------|
| `/admin/content` | `src/routes/admin/content/index.tsx` |
| `/admin/content/about` | `src/routes/admin/content/about.tsx` |
| `/admin/content/find-us` | `src/routes/admin/content/find-us.tsx` |

Shared nav: `src/components/admin/ContentSubnav.tsx`.

---

## Media upload (CMS)

Products already had upload via `/api/admin/upload?slug=…`.

CMS uses the same endpoint with slug prefix `cms/`:

| Admin field | Upload folder slug | Example URL |
|-------------|-------------------|-------------|
| Hero poster / video | `cms/hero` | `/uploads/cms/hero/photo.jpg` |
| Photo strip tile N | `cms/photo-strip-N` | `/uploads/cms/photo-strip-1/…` |
| About sidebar N | `cms/sidebar-N` | `/uploads/cms/sidebar-1/…` |

Component: `src/components/admin/CmsMediaField.tsx`  
API helper: `uploadCmsMedia()` in `src/lib/admin-api.ts`

**Storage:**

- **Production:** Cloudflare R2 (`UPLOADS` binding in `wrangler.jsonc`) — **must be enabled in Cloudflare Dashboard first**
- **Local dev:** `public/uploads/…`

**If upload fails with "Filesystem storage is not available":** R2 is not configured on the Worker. See [sprint-s5-deployment.md](./sprint-s5-deployment.md#r2-image-uploads-admin).

Served at `/uploads/$` via `src/routes/uploads/$.ts`.

---

## What Beatrice can edit herself

| Area | Admin path | Notes |
|------|------------|-------|
| Marquee banner | Content → Homepage | Text + optional link |
| Hero texts + media | Content → Homepage | Upload button for poster/video |
| 3 homepage photos | Content → Homepage | Labels, links, upload |
| Spotify / Bingin Sounds | Content → Homepage | Title, playlist URL |
| About copy + photos | Content → About | Sections, values, sidebar |
| Find us + boutiques | Content → Find us | Atlist URLs, stockist list |
| Products & promos | Products | Prices, sale, images |
| Blog articles | Blog | Travel Diaries |
| Shipping / returns text | Pages | Per-page editor |

**Still via dev / Mario:**

- New page templates or layout changes
- DNS / domain cutover
- Stripe secrets, deploy
- Bulk Shopify catalog re-import
- Very large video files (WeTransfer → upload on server)

---

## Catalog sync (Shopify)

```bash
npm run catalog:import    # scripts/download-shopify-images.mjs + generate-catalog.mjs
npm run shopify:sync      # brand copy snapshot (about, care, sizing)
npm run db:seed-catalog   # Postgres import
npm run deploy
```

Outputs: `src/data/catalog.json`, `public/catalog.json`, `public/shopify-import/`.

---

## Important files

| Topic | Path |
|-------|------|
| Hero | `src/components/lifestyle/CinematicHero.tsx` |
| Photo strip | `src/components/lifestyle/HomePhotoStrip.tsx` |
| Instagram | `src/components/lifestyle/InstagramSection.tsx` |
| Collection filters | `src/routes/collection.tsx` |
| Find us | `src/components/site/FindUsPage.tsx` |
| About | `src/routes/about.tsx` |
| CMS types | `src/lib/content-types.ts` |
| CMS server | `server/db/cms-site.mjs` |
| CMS defaults | `server/content-defaults.mjs` |
| Uploads | `server/uploads.mjs` |
| Navigation | `src/lib/navigation.ts` |
| Atlist defaults | `src/data/atlist.ts` |
| Stockists JSON (seed) | `src/data/stockists.json` |

---

## Cloudflare Worker note

**Never use `readFileSync` in `server/content-defaults.mjs`** — Workers have no filesystem. Stockists default data is bundled via:

```js
import stockists from "../src/data/stockists.json" with { type: "json" };
```

---

## Related docs

- [instagram-automation.md](./instagram-automation.md) — weekly GitHub Action
- [06-deployment.md](./06-deployment.md) — secrets, R2, deploy
- [sprint-s5-deployment.md](./sprint-s5-deployment.md) — go-live checklist
