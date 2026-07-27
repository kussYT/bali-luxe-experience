/** Default editorial content — mirrors src/data/lifestyle-content.ts (fallback when DB empty). */

import stockists from "../src/data/stockists.json" with { type: "json" };
import {
  SITE_LOCALE_CODES,
  resolveProductMessagesLocaleBlock,
  resolveNavigationLocaleBlock,
  resolveCmsBlobLocaleBlock,
} from "./i18n-locales.mjs";

export const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
  text: "Slow-made between Bali & France — Complimentary shipping over €150 — Fall / Winter 2026",
  link: "",
};

export const DEFAULT_HOMEPAGE = {
  hero: {
    eyebrow: "Bingin Diaries · Bali & France",
    title: "Endless Summer, Made in Bali",
    subtitle: "Bali stories, worn everywhere — slow fashion for sun, travel, and the art of living lightly.",
    poster: "/lifestyle/hero.jpg",
    videoSrc: "/lifestyle/hero.mp4",
    ctaPrimary: "Shop the collection",
    ctaPrimaryHref: "/collection",
    ctaSecondary: "Explore the journal",
    ctaSecondaryHref: "/travel-diaries",
  },
  editorial: {
    sub: "Inspired by slow living",
    line: "Designed in Bali",
    body: "Sketched between rice fields and ocean cliffs — each hat begins as a mood, not a trend.",
    image: "/lifestyle/editorial-designed.jpg",
    linkLabel: "Our story",
    linkHref: "/about",
  },
  featuredSection: {
    eyebrow: "Curated",
    title: "Pieces of the season",
  },
  spotlightProduct: {
    enabled: false,
    productSlug: "",
    eyebrow: "Spotlight",
    title: "",
    description: "",
    image: "",
    ctaLabel: "Discover the piece",
  },
  navigation: {
    newCollection: "",
    shop: "",
    sales: "",
    aboutUs: "",
    popularSearches: [],
    locales: {},
  },
  megaMenuFeatured: {
    newCollection: [
      {
        label: "Mi Paradisio",
        to: "/collection",
        image: "/lifestyle/lookbook-sunburn.jpg",
        collectionSlug: "mi-paradisio-collection",
      },
      {
        label: "Special Occasions",
        to: "/collection",
        image: "/lifestyle/journal-sunset.jpg",
        collectionSlug: "special-occasions",
      },
    ],
    shop: [
      {
        label: "Summer hats",
        to: "/collection",
        image: "/lifestyle/lookbook-sunburn.jpg",
        collectionSlug: "sunburn",
      },
      {
        label: "Best sellers",
        to: "/collection",
        image: "/lifestyle/shop-mood.jpg",
        collectionSlug: "best-sellers",
      },
    ],
    sales: [
      {
        label: "All sale",
        to: "/collection",
        image: "/lifestyle/lookbook-salt.jpg",
        sale: true,
      },
      {
        label: "Mi Paradisio",
        to: "/collection",
        image: "/lifestyle/shop-mood.jpg",
        collectionSlug: "mi-paradisio-collection",
      },
    ],
    about: [
      { label: "Travel Diaries", to: "/travel-diaries", image: "/lifestyle/lookbook-sunburn.jpg" },
      { label: "The brand", to: "/about", image: "/lifestyle/craft-hands.jpg" },
    ],
  },
  photoStrip: {
    layout: "grid",
    tiles: [
      {
        label: "Mi Paradisio",
        image: "/lifestyle/lookbook-sunburn.jpg",
        href: "/collection",
        search: { c: "mi-paradisio-collection" },
      },
      {
        label: "Sunburn",
        image: "/lifestyle/lookbook-salt.jpg",
        href: "/collection",
        search: { c: "sunburn" },
      },
      {
        label: "The Rimba",
        image: "/lifestyle/journal-sunset.jpg",
        href: "/collection",
        search: { c: "the-rimba" },
      },
    ],
  },
  lookbook: {
    eyebrow: "Bali Chapters",
    title: "Summer stories",
    linkLabel: "Shop the look",
    chapters: [
      {
        title: "Chapter I — Sunburn",
        caption: "Endless summer days",
        image: "/lifestyle/lookbook-sunburn.jpg",
        align: "left",
      },
      {
        title: "Chapter II — Salt Air",
        caption: "Hand-woven in Bali",
        image: "/lifestyle/lookbook-salt.jpg",
        align: "right",
      },
      {
        title: "Chapter III — Riviera Light",
        caption: "From Bingin to the world",
        image: "/lifestyle/lookbook-riviera.jpg",
        align: "left",
      },
    ],
  },
  shopTheMood: {
    image: "/lifestyle/shop-mood.jpg",
    alt: "Lifestyle look — Bingin Diaries",
    hotspots: [
      { id: "rimba", x: 38, y: 28, label: "The Rimba Sand", productSlug: "the-rimba-sand" },
      { id: "fisher", x: 62, y: 52, label: "90's Fisherman", productSlug: "90s-fisherman-ecru" },
      { id: "bucket", x: 24, y: 68, label: "Le Bucket", productSlug: "le-bucket-ranger" },
      { id: "knit", x: 78, y: 34, label: "Summer beanie", productSlug: "soft-pink-summer-beanie" },
    ],
  },
  craft: {
    eyebrow: "Craft & material",
    title: "The details that matter",
    items: [
      {
        title: "Natural fabrics",
        text: "Breathable weaves chosen for heat, humidity, and long days in the sun.",
        image: "/lifestyle/craft-fabric.jpg",
      },
      {
        title: "Hand-finished details",
        text: "Every brim shaped and checked in our Bali atelier before it travels.",
        image: "/lifestyle/craft-hands.jpg",
      },
      {
        title: "Made for travel",
        text: "Lightweight pieces that pack flat and recover their form with ease.",
        image: "/lifestyle/craft-travel.jpg",
      },
      {
        title: "Conscious packaging",
        text: "Recycled papers, cotton dust bags, no plastic — slow from studio to door.",
        image: "/lifestyle/craft-packaging.jpg",
      },
    ],
  },
  quote: {
    text: "Each piece carries the memory of the hands that made it — a small diary of sun, salt, and slow time.",
    attribution: "The atelier · Bali & France",
  },
  journalSection: {
    eyebrow: "Bingin Diaries Journal",
    title: "Travel & slow living",
  },
  binginSounds: {
    title: "Bingin Sounds",
    playlistName: "Heatwave SS23",
    description: "Sounds for slow mornings, salty hair and endless sunsets.",
    spotifyUrl: "https://open.spotify.com/playlist/1gD6v7Z3KgFIBbTHHccpeL",
    spotifyPlaylistId: "1gD6v7Z3KgFIBbTHHccpeL",
  },
  ambientSound: {
    audioSrc: "/audio/ambient.mp3",
  },
  travelDiariesPage: {
    eyebrow: "Bingin Diaries Journal",
    title: "Slow notes from Bali & beyond",
    description: "Plages, cafés, moodboards et looks — une dimension lifestyle pour voyager avec la maison.",
  },
  seo: {
    title: "Bingin Diaries — Hand-woven hats from Bali & France",
    metaDescription:
      "A boutique house of sun-soaked hats, hand-woven between Canggu and Paris.",
  },
};

export const DEFAULT_ABOUT = {
  eyebrow: "La marque",
  title: "LA MARQUE",
  metaDescription:
    "L'histoire de Bingin Diaries — chapeaux artisanaux entre Bali, le Portugal et la France.",
  youtubeId: "Ol56ZDhtlnY",
  sections: [
    {
      id: "vision",
      eyebrow: "01 — Attitude",
      title: "Une attitude, une singularité",
      body: "S’offrir un chapeau, c’est avant tout s’offrir une attitude, une authenticité, de l’audace et une singularité… Attachés à des moments qui se collectent, des souvenirs indélébiles et pour cultiver sa différence, chez Bingin Diaries, nous dessinons, créons et pensons nos collections pour qu’elles soient singulières & mémorables.",
    },
    {
      id: "artisans",
      eyebrow: "02 — Artisans",
      title: "Une marque juste & humaine",
      body: "BINGIN DIARIES EST UNE MARQUE juste & humaine et impliquée dans les communautés qui confectionnent nos chapeaux. Derrière chaque pièce que vous portez, il y a un homme ou une femme, UNE HISTOIRE. NOUS entretenons des relations étroites avec NOS artisans. Nous engageons la marque envers le respect des droits des travailleurs, DES CONDITIONS DE TRAVAIL équitables et une volonté de contribuer positivement au développement des communautés locales À BALI ET AU PORTUGAL.",
    },
    {
      id: "quality",
      eyebrow: "03 — Matières",
      title: "Qualité, durabilité & éco-responsabilité",
      body: "Nos chapeaux sont le reflet de notre engagement envers la qualité et la durabilité. Nous apportons une grande importance aux matériaux utilisés dans la fabrication des chapeaux, ET VEILLONS JOUR APRÈS JOUR À NOUS RAPPROCHER DE CHAPEAUX 100% ÉCO-RESPONSABLE. Les chapeaux sont dessinés et stockés en France.",
    },
    {
      id: "france",
      eyebrow: "04 — France",
      title: "Dessinés & stockés en France",
      body: "Avec Bingin Diaries, vos chapeaux s’emportent au rythme de vos souvenirs et vos styles s’exportent au tempo de votre authenticité.",
    },
  ],
  values: [
    { n: "01", t: "Artisans connus", d: "Bali & Portugal — une histoire derrière chaque pièce." },
    { n: "02", t: "Matières durables", d: "Vers des chapeaux de plus en plus éco-responsables." },
    { n: "03", t: "Slow fashion", d: "Collections singulières, mémorables, faites pour durer." },
  ],
  sidebarLinks: [
    { label: "La marque", to: "/about", hash: "vision", image: "/lifestyle/craft-hands.jpg" },
    { label: "Artisans & éthique", to: "/about", hash: "artisans", image: "/lifestyle/craft-fabric.jpg" },
    { label: "Matières & qualité", to: "/about", hash: "quality", image: "/lifestyle/editorial-designed.jpg" },
    { label: "Guide d'entretien", to: "/care", image: "/lifestyle/craft-travel.jpg" },
    { label: "Guide des tailles", to: "/sizing", image: "/lifestyle/journal-bingin.jpg" },
    { label: "Find us", to: "/find-us", image: "/lifestyle/shop-mood.jpg" },
    { label: "Shipping", to: "/shipping", image: "/lifestyle/lookbook-salt.jpg" },
    { label: "Returns", to: "/returns", image: "/lifestyle/journal-sunset.jpg" },
    { label: "Travel Diaries", to: "/travel-diaries", image: "/lifestyle/lookbook-sunburn.jpg" },
    { label: "Contact", to: "/contact", image: "/lifestyle/lookbook-riviera.jpg" },
  ],
};

export const DEFAULT_FIND_US = {
  eyebrow: "Retailers",
  title: "Find us",
  metaDescription: "Find Bingin Diaries at select boutiques in Bali, France, Spain, Finland and more.",
  description:
    "Discover Bingin Diaries at select boutiques around the world — from Bali to Europe and beyond.",
  atlistEmbedUrl: "https://my.atlist.com/map/eb6f5d5f-087a-4f52-934e-affcbb8d5f09?share=true",
  atlistMapUrl: "https://my.atlist.com/map/eb6f5d5f-087a-4f52-934e-affcbb8d5f09",
  wholesaleEmail: stockists.wholesaleEmail,
  wholesaleTitle: "You are a retailer and want to work with us?",
  wholesaleCtaLabel: "Contact the house",
  showStockistList: true,
  countries: stockists.countries,
};

export const DEFAULT_CONTACT = {
  eyebrow: "Get in touch",
  title: "Write to us.",
  metaDescription: "Write to the Bingin Diaries team.",
  description:
    "For special orders, press, wholesale, or simply to say hello — we read every message.",
  email: "info@bingindiaries.com",
  formName: "Name",
  formEmail: "Email",
  formSubject: "Subject",
  formMessage: "Message",
  formSubmit: "Send message",
  formSending: "Sending…",
  formSent: "Message sent — merci",
};

export const DEFAULT_CARE = {
  eyebrow: "Entretien",
  title: "Guide d'entretien",
  metaDescription:
    "A well-cared-for hat stays beautiful for a long time. Our pieces are made to last with a few simple habits, you can keep their shape, texture, and style season after season.",
  intro:
    "A well-cared-for hat stays beautiful for a long time. Our pieces are made to last with a few simple habits, you can keep their shape, texture, and style season after season.",
  images: [
    {
      src: "/care/how-to-care.png",
      alt: "How to take care of your hat — Bingin Diaries",
    },
    {
      src: "/care/care-by-material.png",
      alt: "Care guide by hat type — Bingin Diaries",
    },
  ],
  sections: [
    {
      title: "Coton",
      tips: ["• Dry clean is best", "• Or clean by hand only on the stain", "• Do not machine wash"],
    },
    {
      title: "Wool",
      tips: [
        "• Hand wash only",
        "• Use cold water",
        "• Do not rub or twist",
        "• Do not use a dryer",
        "• Dry flat in open air",
      ],
    },
    {
      title: "Cashmere",
      tips: [
        "• Use a soft brush",
        "• Brush anti-clockwise",
        "• Brush from top to bottom",
        "• Keep away from water",
      ],
    },
    {
      title: "Beanies",
      tips: [
        "• Hand wash only",
        "• Use cold water",
        "• Do not use a dryer",
        "• Dry flat in open air",
      ],
    },
    {
      title: "Caps",
      tips: ["• Hand wash", "• Cold water only", "• Do not twist", "• Air dry"],
    },
    {
      title: "Le bucket / radio soleil",
      tips: [
        "• Keep away from water",
        "• Do not wash",
        "• Clean gently with a dry cloth if needed",
      ],
    },
    {
      title: "General",
      tips: [
        "General tip: Store your hat flat or on a stand to keep its shape. Keep it away from humidity and heat.",
      ],
    },
  ],
  backLink: "← Retour à la marque",
};

export const DEFAULT_SIZING = {
  eyebrow: "Fit",
  title: "Guide des tailles",
  metaDescription: "Tailles et ajustements des chapeaux Bingin Diaries.",
  body: [
    "Most Bingin Diaries hats are adjustable with an interior ribbon (sizes M & L).",
    "Refer to the chart below for brim and crown measurements.",
  ],
  image:
    "https://cdn.shopify.com/s/files/1/0437/5992/7449/files/Bingin-Sizing-edit_for_web_1.png?v=1755161480",
  imageAlt: "Bingin Diaries size guide",
  backLink: "← Retour à la marque",
};

export const DEFAULT_FOOTER = {
  shopTitle: "Shop",
  shopAll: "All pieces",
  shopSale: "Sale",
  shopWishlist: "Wishlist",
  careTitle: "Customer care",
  contactUs: "Contact us",
  sizeGuide: "Size guide",
  careGuide: "Care guide",
  faq: "FAQ",
  shipping: "Shipping",
  returns: "Return policy",
  exploreTitle: "Explore",
  theBrand: "The brand",
  travelGuide: "Travel guide",
  privacyTitle: "Privacy",
  terms: "Terms & conditions",
  artisans: "Artisans & ethics",
  materials: "Materials & quality",
  copyright: "© 2026 Bingin Diaries",
};

export const DEFAULT_PRODUCT_MESSAGES = {
  regionalUnavailable:
    "Cette pièce n'est pas disponible pour une livraison en {country}. Le stock pour votre zone est expédié depuis notre atelier {warehouse}. Changez le pays de livraison dans le menu pour voir les pièces proposées dans votre zone.",
  soldOut: "Rupture de stock",
  unavailableInRegion: "Indisponible dans votre région",
  addToBag: "Ajouter au panier",
  inStock: "{count} en stock{variant} — expédié depuis {warehouse}",
};

export const DEFAULT_PRODUCT_MESSAGES_BY_LOCALE = {
  fr: DEFAULT_PRODUCT_MESSAGES,
  en: {
    regionalUnavailable:
      "This piece is not available for delivery to {country}. Stock for your zone ships from our {warehouse} workshop. Change your delivery country in the menu to see pieces available in your region.",
    soldOut: "Sold out",
    unavailableInRegion: "Unavailable in your region",
    addToBag: "Add to bag",
    inStock: "{count} in stock{variant} — shipped from {warehouse}",
  },
  id: {
    regionalUnavailable:
      "Produk ini tidak tersedia untuk pengiriman ke {country}. Stok untuk wilayah Anda dikirim dari bengkel {warehouse} kami. Ubah negara pengiriman di menu untuk melihat produk yang tersedia di wilayah Anda.",
    soldOut: "Habis",
    unavailableInRegion: "Tidak tersedia di wilayah Anda",
    addToBag: "Tambah ke tas",
    inStock: "{count} tersedia{variant} — dikirim dari {warehouse}",
  },
  es: {
    regionalUnavailable:
      "Esta pieza no está disponible para envíos a {country}. El stock de tu zona se envía desde nuestro taller en {warehouse}. Cambia el país de entrega en el menú para ver las piezas disponibles en tu zona.",
    soldOut: "Agotado",
    unavailableInRegion: "No disponible en tu región",
    addToBag: "Añadir a la bolsa",
    inStock: "{count} en stock{variant} — enviado desde {warehouse}",
  },
};

function isLegacyProductMessages(stored) {
  return (
    stored &&
    typeof stored === "object" &&
    ("addToBag" in stored || "soldOut" in stored) &&
    !stored.locales
  );
}

export function normalizeProductMessagesStored(stored) {
  const locales = {};
  for (const code of SITE_LOCALE_CODES) {
    locales[code] = deepMerge(DEFAULT_PRODUCT_MESSAGES_BY_LOCALE[code], {});
  }

  if (isLegacyProductMessages(stored)) {
    locales.fr = deepMerge(DEFAULT_PRODUCT_MESSAGES, stored);
  } else if (stored?.locales && typeof stored.locales === "object") {
    for (const code of SITE_LOCALE_CODES) {
      if (stored.locales[code]) {
        locales[code] = deepMerge(DEFAULT_PRODUCT_MESSAGES_BY_LOCALE[code], stored.locales[code]);
      }
    }
  }

  return { locales };
}

export function resolveProductMessages(stored, locale) {
  const { locales } = normalizeProductMessagesStored(stored);
  const resolved = resolveProductMessagesLocaleBlock(locales, locale);
  const defaults = DEFAULT_PRODUCT_MESSAGES_BY_LOCALE[resolved?.code] || DEFAULT_PRODUCT_MESSAGES;
  const block = resolved?.block || locales.fr || DEFAULT_PRODUCT_MESSAGES;
  return {
    regionalUnavailable: block.regionalUnavailable?.trim() || defaults.regionalUnavailable,
    soldOut: block.soldOut?.trim() || defaults.soldOut,
    unavailableInRegion: block.unavailableInRegion?.trim() || defaults.unavailableInRegion,
    addToBag: block.addToBag?.trim() || defaults.addToBag,
    inStock: block.inStock?.trim() || defaults.inStock,
  };
}

const DEFAULT_NAVIGATION_BY_LOCALE = {
  fr: {
    newCollection: "Nouvelle collection",
    shop: "Boutique",
    sales: "Soldes",
    aboutUs: "À propos",
    popularSearches: [],
  },
  en: {
    newCollection: "New Collection",
    shop: "Shop",
    sales: "Sales",
    aboutUs: "About us",
    popularSearches: [],
  },
  id: {
    newCollection: "Koleksi baru",
    shop: "Toko",
    sales: "Obral",
    aboutUs: "Tentang kami",
    popularSearches: [],
  },
  es: {
    newCollection: "Nueva colección",
    shop: "Tienda",
    sales: "Rebajas",
    aboutUs: "Sobre nosotros",
    popularSearches: [],
  },
};

function emptyNavigationFields() {
  return { newCollection: "", shop: "", sales: "", aboutUs: "", popularSearches: [] };
}

export function normalizeNavigationStored(stored) {
  const locales = {};
  for (const code of SITE_LOCALE_CODES) {
    locales[code] = deepMerge(DEFAULT_NAVIGATION_BY_LOCALE[code], emptyNavigationFields());
  }

  if (stored?.locales && typeof stored.locales === "object") {
    for (const code of SITE_LOCALE_CODES) {
      if (stored.locales[code]) {
        locales[code] = deepMerge(locales[code], stored.locales[code]);
      }
    }
  }

  const legacyFlat = {
    newCollection: stored?.newCollection?.trim() || "",
    shop: stored?.shop?.trim() || "",
    sales: stored?.sales?.trim() || "",
    aboutUs: stored?.aboutUs?.trim() || "",
    popularSearches: Array.isArray(stored?.popularSearches) ? stored.popularSearches : [],
  };
  if (legacyFlat.newCollection || legacyFlat.shop || legacyFlat.sales || legacyFlat.aboutUs) {
    locales.en = deepMerge(locales.en, legacyFlat);
  }

  return { locales, legacyFlat };
}

export function resolveNavigation(stored, locale) {
  const { locales, legacyFlat } = normalizeNavigationStored(stored || {});
  const resolved = resolveNavigationLocaleBlock(locales, locale);
  const defaults = DEFAULT_NAVIGATION_BY_LOCALE[resolved?.code] || DEFAULT_NAVIGATION_BY_LOCALE.en;
  const block = resolved?.block || locales.fr || defaults;
  const pick = (key) => block[key]?.trim() || legacyFlat[key]?.trim() || defaults[key] || "";
  return {
    newCollection: pick("newCollection"),
    shop: pick("shop"),
    sales: pick("sales"),
    aboutUs: pick("aboutUs"),
    popularSearches:
      Array.isArray(block.popularSearches) && block.popularSearches.length
        ? block.popularSearches
        : legacyFlat.popularSearches.length
          ? legacyFlat.popularSearches
          : defaults.popularSearches,
  };
}

export function navigationStoredForAdmin(stored) {
  return normalizeNavigationStored(stored || {});
}

export const DEFAULT_POSTS = [
  {
    slug: "a-day-in-bingin",
    title: "A Day in Bingin",
    excerpt: "Black sand, morning surf, and the quiet rhythm of the cliff.",
    image: "/lifestyle/journal-bingin.jpg",
    category: "Guides",
    readMinutes: 4,
    body: [
      "Wake before the heat. Walk the path down to the beach with coffee still warm in hand.",
      "Bingin rewards patience — a small bay, turquoise water, and afternoons that stretch into gold.",
      "We weave here between tides: sketching shapes, testing brims, letting the salt air settle into every fiber.",
    ],
  },
  {
    slug: "our-favorite-sunset-spots",
    title: "Our Favorite Sunset Spots",
    excerpt: "Where the light turns honey and the ocean feels endless.",
    image: "/lifestyle/journal-sunset.jpg",
    category: "Places",
    readMinutes: 5,
    body: [
      "Uluwatu temple steps. A cold lime soda. The sound of wax on a board.",
      "Canggu rice fields on the drive home — palm shadows long and slow.",
      "Our hats were made for these hours: soft brim, sun at your back, nowhere to be.",
    ],
  },
  {
    slug: "the-bali-packing-list",
    title: "The Bali Packing List",
    excerpt: "Light layers, natural fabrics, and room for souvenirs.",
    image: "/lifestyle/journal-packing.jpg",
    category: "Moodboards",
    readMinutes: 3,
    body: [
      "One woven hat. One bucket for market mornings. Linen everything.",
      "Leave space for rattan, ceramics, and the dress you will wear twice.",
      "Pack slow — Bali teaches you to carry less and feel more.",
    ],
  },
  {
    slug: "slow-mornings-in-uluwatu",
    title: "Slow Mornings in Uluwatu",
    excerpt: "Clifftop light, open windows, and the first swim of the day.",
    image: "/lifestyle/journal-uluwatu.jpg",
    category: "Stories",
    readMinutes: 4,
    body: [
      "The villa wakes with birds and distant gamelan.",
      "We steam pandan tea, lay out straw on the table, and review yesterday's weave.",
      "By noon the brim is set. By sunset it is yours.",
    ],
  },
];

export const DEFAULT_PAGES = [
  {
    slug: "shipping",
    title: "Shipping",
    eyebrow: "Customer care",
    metaDescription: "Shipping information for Bingin Diaries orders worldwide.",
    body: [
      "We ship worldwide from our ateliers in Canggu and Paris. Orders are dispatched within 2–4 business days.",
      "Delivery times vary by destination — typically 3–7 days within Europe, 7–14 days internationally.",
      "You'll receive tracking details by email once your order leaves the atelier.",
    ],
  },
  {
    slug: "returns",
    title: "Returns",
    eyebrow: "Customer care",
    metaDescription: "Returns policy for Bingin Diaries.",
    body: [
      "Unworn pieces may be returned within 14 days of delivery. Items must be in original condition with tags attached.",
      "To start a return, contact us at info@bingindiaries.com with your order number.",
      "Refunds are processed within 5–10 business days after we receive your return.",
    ],
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    eyebrow: "Customer care",
    metaDescription: "Answers to common questions about Bingin Diaries orders, sizing, and care.",
    body: [
      "How long does shipping take? Orders leave our atelier within 2–4 business days. Delivery is typically 3–7 days in Europe and 7–14 days internationally.",
      "Can I return a hat? Unworn pieces may be returned within 14 days. See our return policy or email info@bingindiaries.com with your order number.",
      "How do I choose a size? Each style fits differently — use our size guide or contact us with your head measurement and we will help.",
      "Are your hats really hand-woven? Yes. Each piece is woven by artisans we work with directly in Bali, with finishing in France.",
      "Still have a question? Write to info@bingindiaries.com — we reply within one business day.",
    ],
  },
  {
    slug: "terms",
    title: "Terms & conditions",
    eyebrow: "Legal",
    metaDescription: "Terms and conditions for purchases on bingindiaries.com.",
    body: [
      "These terms apply to all orders placed on bingindiaries.com. By completing a purchase you agree to them.",
      "Prices are shown in EUR unless another currency is selected at checkout. Payment is processed securely via Stripe.",
      "We reserve the right to cancel an order in case of stock error, pricing mistake, or suspected fraud — you will be refunded in full.",
      "Products remain our property until payment is received in full. Risk passes to you upon delivery to the carrier.",
      "For returns, shipping, and privacy, see the linked policies in the footer. Questions: info@bingindiaries.com.",
      "French law applies. Any dispute shall be submitted to the competent courts in France, subject to mandatory consumer rights in your country of residence.",
    ],
  },
];

/** Slugs editable via Admin → Pages (info pages with per-locale body). */
export const CMS_PAGE_SLUGS = DEFAULT_PAGES.map((p) => p.slug);

/** Site content keys editable via Admin → Content (structured pages). */
export const SITE_CONTENT_PAGE_KEYS = [
  "homepage",
  "about",
  "findUs",
  "contact",
  "care",
  "sizing",
  "footer",
  "productMessages",
];

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return patch ?? base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const val = patch[key];
    if (val && typeof val === "object" && !Array.isArray(val) && base[key] && typeof base[key] === "object") {
      out[key] = deepMerge(base[key], val);
    } else if (val !== undefined) {
      out[key] = val;
    }
  }
  return out;
}

const SHOPIFY_CDN_BASE = "https://cdn.shopify.com/s/files/1/0437/5992/7449/files";

/** Rewrite dead bingindiaries.com/cdn/shop/... paths to Shopify CDN (still hosted by Shopify). */
export function rewriteLegacyShopifyImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();
  const match = trimmed.match(/\/cdn\/shop\/files\/(.+)$/i);
  if (match) return `${SHOPIFY_CDN_BASE}/${match[1]}`;
  return trimmed;
}

/** Legacy Shopify paths on our domain 404 after migration off Shopify. */
export function isBrokenCmsImageUrl(url) {
  if (!url || typeof url !== "string") return true;
  return url.includes("/cdn/shop/");
}

function resolveCmsImageUrl(url, fallback) {
  if (!url || typeof url !== "string") return fallback;
  if (isBrokenCmsImageUrl(url)) return rewriteLegacyShopifyImageUrl(url) || fallback;
  return url;
}

/** Accept bare ID, full Spotify URL, or ID with ?si= query params pasted by mistake. */
export function extractSpotifyPlaylistId(idOrUrl) {
  if (!idOrUrl || typeof idOrUrl !== "string") return "";
  const trimmed = idOrUrl.trim();
  const fromUrl = trimmed.match(/playlist\/([a-zA-Z0-9]+)/);
  if (fromUrl) return fromUrl[1];
  return trimmed.split("?")[0].split("&")[0];
}

function sanitizePhotoStrip(photoStrip) {
  const defaults = DEFAULT_HOMEPAGE.photoStrip;
  if (!photoStrip?.tiles?.length) return defaults;
  return {
    ...photoStrip,
    tiles: photoStrip.tiles.map((tile, i) => ({
      ...tile,
      image: isBrokenCmsImageUrl(tile.image)
        ? resolveCmsImageUrl(tile.image, defaults.tiles[i]?.image ?? defaults.tiles[0].image)
        : tile.image,
    })),
  };
}

function sanitizeBinginSounds(binginSounds) {
  const defaults = DEFAULT_HOMEPAGE.binginSounds;
  const merged = { ...defaults, ...(binginSounds || {}) };
  const id =
    extractSpotifyPlaylistId(merged.spotifyPlaylistId) ||
    extractSpotifyPlaylistId(merged.spotifyUrl) ||
    defaults.spotifyPlaylistId;
  return {
    ...merged,
    spotifyPlaylistId: id,
    spotifyUrl: merged.spotifyUrl?.includes("open.spotify.com")
      ? merged.spotifyUrl.split("?")[0]
      : `https://open.spotify.com/playlist/${id}`,
  };
}

export function sanitizeHomepage(homepage) {
  return {
    ...homepage,
    photoStrip: sanitizePhotoStrip(homepage.photoStrip),
    binginSounds: sanitizeBinginSounds(homepage.binginSounds),
  };
}

export function mergeHomepage(stored) {
  return sanitizeHomepage(deepMerge(DEFAULT_HOMEPAGE, stored || {}));
}

export function mergeAnnouncement(stored) {
  return { ...DEFAULT_ANNOUNCEMENT, ...(stored || {}) };
}

export function mergeFindUs(stored) {
  return deepMerge(DEFAULT_FIND_US, stored || {});
}

export function mergeContact(stored) {
  return deepMerge(DEFAULT_CONTACT, stored || {});
}

export function mergeCare(stored) {
  return deepMerge(DEFAULT_CARE, stored || {});
}

export function mergeAbout(stored) {
  return resolveAbout(stored, "fr");
}

export function mergeSizing(stored) {
  return resolveSizing(stored, "fr");
}

function aboutLocaleFieldsFromFlat(flat) {
  return {
    eyebrow: flat.eyebrow || "",
    title: flat.title || "",
    metaDescription: flat.metaDescription || "",
    sections: Array.isArray(flat.sections) ? flat.sections : [],
    values: Array.isArray(flat.values) ? flat.values : [],
    sidebarLinks: Array.isArray(flat.sidebarLinks) ? flat.sidebarLinks : [],
  };
}

/** Normalize about blob to { youtubeId, locales }. Migrates legacy flat content → locales.fr */
export function normalizeAboutStored(stored) {
  const raw = stored && typeof stored === "object" ? stored : {};
  if (raw.locales && typeof raw.locales === "object" && Object.keys(raw.locales).length > 0) {
    const youtubeId =
      typeof raw.youtubeId === "string" && raw.youtubeId.trim()
        ? raw.youtubeId.trim()
        : DEFAULT_ABOUT.youtubeId;
    return { youtubeId, locales: { ...raw.locales } };
  }
  const merged = deepMerge(DEFAULT_ABOUT, raw);
  return {
    youtubeId: merged.youtubeId,
    locales: { fr: aboutLocaleFieldsFromFlat(merged) },
  };
}

export function resolveAbout(stored, locale = "fr") {
  const normalized = normalizeAboutStored(stored);
  const resolved = resolveCmsBlobLocaleBlock(normalized.locales, locale);
  const block = resolved?.block || aboutLocaleFieldsFromFlat(DEFAULT_ABOUT);
  return {
    youtubeId: normalized.youtubeId || DEFAULT_ABOUT.youtubeId,
    eyebrow: block.eyebrow || "",
    title: block.title || "",
    metaDescription: block.metaDescription || "",
    sections: Array.isArray(block.sections) ? block.sections : DEFAULT_ABOUT.sections,
    values: Array.isArray(block.values) ? block.values : DEFAULT_ABOUT.values,
    sidebarLinks: Array.isArray(block.sidebarLinks) ? block.sidebarLinks : DEFAULT_ABOUT.sidebarLinks,
  };
}

function sizingLocaleFieldsFromFlat(flat) {
  return {
    eyebrow: flat.eyebrow || "",
    title: flat.title || "",
    metaDescription: flat.metaDescription || "",
    body: Array.isArray(flat.body) ? flat.body : [],
    imageAlt: flat.imageAlt || "",
    backLink: flat.backLink || "",
  };
}

/** Normalize sizing blob to { image, imageFocal, locales }. */
export function normalizeSizingStored(stored) {
  const raw = stored && typeof stored === "object" ? stored : {};
  if (raw.locales && typeof raw.locales === "object" && Object.keys(raw.locales).length > 0) {
    return {
      image: typeof raw.image === "string" ? raw.image : DEFAULT_SIZING.image,
      imageFocal: raw.imageFocal,
      locales: { ...raw.locales },
    };
  }
  const merged = deepMerge(DEFAULT_SIZING, raw);
  return {
    image: merged.image,
    imageFocal: merged.imageFocal,
    locales: { fr: sizingLocaleFieldsFromFlat(merged) },
  };
}

export function resolveSizing(stored, locale = "fr") {
  const normalized = normalizeSizingStored(stored);
  const resolved = resolveCmsBlobLocaleBlock(normalized.locales, locale);
  const block = resolved?.block || sizingLocaleFieldsFromFlat(DEFAULT_SIZING);
  return {
    image: normalized.image || DEFAULT_SIZING.image,
    imageFocal: normalized.imageFocal,
    eyebrow: block.eyebrow || "",
    title: block.title || "",
    metaDescription: block.metaDescription || "",
    body: Array.isArray(block.body) ? block.body : DEFAULT_SIZING.body,
    imageAlt: block.imageAlt || "",
    backLink: block.backLink || "",
  };
}

export function mergeFooter(stored) {
  return deepMerge(DEFAULT_FOOTER, stored || {});
}

export function mergeProductMessages(stored) {
  return normalizeProductMessagesStored(stored);
}
