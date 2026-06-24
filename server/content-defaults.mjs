/** Default editorial content — mirrors src/data/lifestyle-content.ts (fallback when DB empty). */

import stockists from "../src/data/stockists.json" with { type: "json" };

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
  {
    slug: "about",
    title: "Two homes, one diary.",
    eyebrow: "The atelier",
    metaDescription: "About Bingin Diaries — hand-woven hats from Bali and France.",
    body: [
      "Born from a long, slow ride between Canggu and the South of France.",
      "Bingin Diaries is a small house of hand-woven hats — designed in France, made in Bali, finished by hand. We work with a few artisans we know by name, in a rhythm that lets each piece breathe.",
      "We believe in a quieter kind of fashion. One that travels well, that ages well, and that carries the memory of the place it came from.",
    ],
  },
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

export function mergeHomepage(stored) {
  return deepMerge(DEFAULT_HOMEPAGE, stored || {});
}

export function mergeAnnouncement(stored) {
  return { ...DEFAULT_ANNOUNCEMENT, ...(stored || {}) };
}

export function mergeAbout(stored) {
  return deepMerge(DEFAULT_ABOUT, stored || {});
}

export function mergeFindUs(stored) {
  return deepMerge(DEFAULT_FIND_US, stored || {});
}
