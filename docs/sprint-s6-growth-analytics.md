# Sprint S6 — Growth, analytics & image polish

Recovery automation (Lot B), product analytics (Lot C), gallery focal cropping, and Google favicon fix.

## Logo Google (favicon)

| Fichier | Rôle actuel | Problème |
|---------|-------------|----------|
| `public/favicon.png` | Favicon navigateur / Google | Fond **noir** + guillemets à peine visibles — mauvais en SERP |
| `public/logo-mark.png` | Header, Apple touch icon | **Vrai signe de marque** (double guillemet Bingin Diaries, fond transparent) |
| `public/logo.png` | `og:image` Twitter/ Facebook | Même souci : fond noir, peu lisible |

**Correctif code (S6)** : le site pointe le favicon et l’og:image vers `/logo-mark.png`.

**Recommandé pour Google** (manuel, une fois) :

1. Exporter un carré **48×48** ou **192×192** px à partir du logo marque (fond blanc ou crème `#f5f0e8`, guillemets noirs).
2. Remplacer `public/favicon.png` par cette version optimisée.
3. Soumettre l’URL dans [Google Search Console](https://search.google.com/search-console) → Inspection d’URL → Demander une indexation.
4. Le favicon Google peut mettre **plusieurs jours** à se mettre à jour.

À terme : champ CMS « Logo & favicon » dans Admin → Contenu (backlog).

---

## Migration

```bash
npm run db:migrate
```

Applique :

| Migration | Contenu |
|-----------|---------|
| `021_product_analytics.sql` | Table `product_analytics_events` |
| (settings) | Clé `abandonedRecovery` dans `site_settings` (pas de migration dédiée) |

---

## Lot B — Récupération paniers abandonnés (auto)

### Déjà en place (Lot A)

- Liste admin **Commandes → Paniers abandonnés**
- Envoi manuel « Relancer par e-mail »
- Page `/checkout/resume?order=…`
- Colonnes `recovery_email_sent_at`, `recovery_email_count`

### Nouveau (S6)

- **Récupération automatique** via cron HTTP
- Réglages admin : activer/désactiver, délai min, max e-mails, code promo optionnel
- E-mail enrichi si un code promo est configuré

### Réglages (`site_settings.abandonedRecovery`)

| Champ | Défaut | Description |
|-------|--------|-------------|
| `enabled` | `false` | Active l’envoi automatique |
| `minAgeHours` | `24` | Panier abandonné depuis au moins X h |
| `maxEmailsPerCart` | `2` | Max relances par commande |
| `minHoursBetweenEmails` | `72` | Délai entre deux relances |
| `promoCode` | `""` | Code promo affiché dans l’e-mail (optionnel) |

### Cron (production)

Endpoint protégé :

```http
POST /api/cron/abandoned-recovery
Authorization: Bearer <CRON_SECRET>
```

Configurer dans Cloudflare **Cron Triggers** (ex. `0 10 * * *` — 1×/jour 10h UTC) ou service externe (cron-job.org).

Secret Wrangler :

```bash
npx wrangler secret put CRON_SECRET
```

### Test local

```bash
curl -X POST http://localhost:8080/api/cron/abandoned-recovery \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Lot C — Analytics produits

### Événements trackés

| Type | Déclencheur |
|------|-------------|
| `view` | Page produit (1× par session / produit) |
| `cart` | Ajout au panier |
| `wishlist` | Ajout wishlist |

### API publique

```http
POST /api/analytics/product
Content-Type: application/json

{ "slug": "gilda-hat", "type": "view" }
```

### Admin

**Admin → Analytics produits** (`/admin/analytics/products`) — top produits sur 30 jours : vues, panier, wishlist.

---

## Cadrage galerie produit

- **Avant** : focal uniquement sur la photo **cover** (position 0)
- **Après** : chaque image de la galerie a son propre `focal_x` / `focal_y` en base
- Admin → Produit : cliquer une vignette, ajuster **Cadrage de la photo**, enregistrer

---

## Deploy checklist

1. `npm run build`
2. `DATABASE_URL=... npm run db:migrate`
3. `npx wrangler secret put CRON_SECRET` (si Lot B auto activé)
4. `npm run deploy`
5. Configurer cron Cloudflare → `POST /api/cron/abandoned-recovery`
6. Admin → Paniers abandonnés → activer récupération auto + promo si souhaité
7. Remplacer `favicon.png` par export carré propre (optionnel mais recommandé pour Google)

## Backlog S7 (non inclus)

- Logo / favicon éditable dans le CMS
- Hero collections (upload + focal)
- Sections homepage editorial / lookbook dans l’admin
- Impression étiquettes transport
