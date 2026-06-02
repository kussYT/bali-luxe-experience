/**
 * Feed Instagram — mock statique.
 * Remplacer `posts` par l’API Instagram (Graph API) plus tard.
 * Voir README dans public/instagram/ ou commentaires ci-dessous.
 */

export const INSTAGRAM = {
  handle: "@bingindiaries",
  profileUrl: "https://www.instagram.com/bingindiaries/",
  title: "Follow the diary",
  subtitle: "Seen in the sun",
} as const;

export type InstagramPost = {
  id: string;
  image: string;
  alt: string;
  /** URL du post — à remplir via API */
  permalink?: string;
};

export const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: "ig-1",
    image: "/lifestyle/lookbook-sunburn.jpg",
    alt: "Summer light — Bingin Diaries",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
  {
    id: "ig-2",
    image: "/lifestyle/journal-sunset.jpg",
    alt: "Golden hour by the sea",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
  {
    id: "ig-3",
    image: "/lifestyle/shop-mood.jpg",
    alt: "Editorial mood",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
  {
    id: "ig-4",
    image: "/lifestyle/journal-bingin.jpg",
    alt: "Bingin beach",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
  {
    id: "ig-5",
    image: "/lifestyle/lookbook-salt.jpg",
    alt: "Salt air",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
  {
    id: "ig-6",
    image: "/lifestyle/editorial-designed.jpg",
    alt: "Designed in Bali",
    permalink: "https://www.instagram.com/bingindiaries/",
  },
];
