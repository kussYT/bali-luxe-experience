/**
 * Contenu lifestyle — images dans public/lifestyle/
 * Regénérer : npm run lifestyle:images
 */

/** Place hero.mp4 ici pour activer la vidéo hero */
export const HERO_VIDEO_SRC = "/lifestyle/hero.mp4";

export const HERO_TAGLINE = "Endless Summer, Made in Bali";

/** Chemins publics — une image distincte par section */
export const IMG = {
  hero: "/lifestyle/hero.jpg",
  editorial: "/lifestyle/editorial-designed.jpg",
  journal: {
    bingin: "/lifestyle/journal-bingin.jpg",
    sunset: "/lifestyle/journal-sunset.jpg",
    packing: "/lifestyle/journal-packing.jpg",
    uluwatu: "/lifestyle/journal-uluwatu.jpg",
  },
  lookbook: {
    sunburn: "/lifestyle/lookbook-sunburn.jpg",
    salt: "/lifestyle/lookbook-salt.jpg",
    riviera: "/lifestyle/lookbook-riviera.jpg",
  },
  shopMood: "/lifestyle/shop-mood.jpg",
  craft: {
    fabric: "/lifestyle/craft-fabric.jpg",
    hands: "/lifestyle/craft-hands.jpg",
    travel: "/lifestyle/craft-travel.jpg",
    packaging: "/lifestyle/craft-packaging.jpg",
  },
} as const;

export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readMinutes: number;
  body: string[];
};

export const EDITORIAL_FEATURE = {
  line: "Designed in Bali",
  sub: "Inspired by slow living",
  body: "Sketched between rice fields and ocean cliffs — each hat begins as a mood, not a trend.",
  image: IMG.editorial,
} as const;

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "a-day-in-bingin",
    title: "A Day in Bingin",
    excerpt: "Black sand, morning surf, and the quiet rhythm of the cliff.",
    image: IMG.journal.bingin,
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
    image: IMG.journal.sunset,
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
    image: IMG.journal.packing,
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
    image: IMG.journal.uluwatu,
    category: "Stories",
    readMinutes: 4,
    body: [
      "The villa wakes with birds and distant gamelan.",
      "We steam pandan tea, lay out straw on the table, and review yesterday's weave.",
      "By noon the brim is set. By sunset it is yours.",
    ],
  },
];

export const LOOKBOOK_CHAPTERS = [
  {
    title: "Chapter I — Sunburn",
    caption: "Endless summer days",
    image: IMG.lookbook.sunburn,
    align: "left" as const,
  },
  {
    title: "Chapter II — Salt Air",
    caption: "Hand-woven in Bali",
    image: IMG.lookbook.salt,
    align: "right" as const,
  },
  {
    title: "Chapter III — Riviera Light",
    caption: "From Bingin to the world",
    image: IMG.lookbook.riviera,
    align: "left" as const,
  },
];

export type MoodHotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  productSlug?: string;
  collectionSearch?: Record<string, string>;
};

export const SHOP_THE_MOOD = {
  image: IMG.shopMood,
  alt: "Lifestyle look — Bingin Diaries",
  hotspots: [
    { id: "rimba", x: 38, y: 28, label: "The Rimba Sand", productSlug: "the-rimba-sand" },
    { id: "fisher", x: 62, y: 52, label: "90's Fisherman", productSlug: "90s-fisherman-ecru" },
    { id: "bucket", x: 24, y: 68, label: "Le Bucket", productSlug: "le-bucket-ranger" },
    { id: "knit", x: 78, y: 34, label: "Summer beanie", productSlug: "soft-pink-summer-beanie" },
  ] satisfies MoodHotspot[],
};

export const CRAFT_DETAILS = [
  {
    title: "Natural fabrics",
    text: "Breathable weaves chosen for heat, humidity, and long days in the sun.",
    image: IMG.craft.fabric,
  },
  {
    title: "Hand-finished details",
    text: "Every brim shaped and checked in our Bali atelier before it travels.",
    image: IMG.craft.hands,
  },
  {
    title: "Made for travel",
    text: "Lightweight pieces that pack flat and recover their form with ease.",
    image: IMG.craft.travel,
  },
  {
    title: "Conscious packaging",
    text: "Recycled papers, cotton dust bags, no plastic — slow from studio to door.",
    image: IMG.craft.packaging,
  },
];

export const BINGIN_SOUNDS = {
  title: "Bingin Sounds",
  playlistName: "Heatwave SS23",
  description: "Sounds for slow mornings, salty hair and endless sunsets.",
  spotifyUrl: "https://open.spotify.com/playlist/1gD6v7Z3KgFIBbTHHccpeL",
  spotifyPlaylistId: "1gD6v7Z3KgFIBbTHHccpeL",
};
