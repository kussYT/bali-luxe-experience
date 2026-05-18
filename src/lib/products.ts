import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

export type ProductCategory = "hats" | "accessories" | "bags";

export type Product = {
  slug: string;
  name: string;
  collection: string;
  category: ProductCategory;
  priceEUR: number;
  priceUSD: number;
  priceIDR: number;
  image: string;
  story: string;
  details: string[];
  tags: string[];
  onSale?: boolean;
  origin: "Bali" | "France";
};

export const products: Product[] = [
  {
    slug: "sunburn-wide-brim",
    name: "Sunburn — Wide Brim",
    collection: "Sunburn",
    category: "hats",
    tags: ["bob", "sand", "surf hat", "wide brim"],
    priceEUR: 240,
    priceUSD: 260,
    priceIDR: 4_200_000,
    image: p1,
    story:
      "A sun-faded silhouette woven by hand on the shores of Canggu. Built for the long, slow afternoons.",
    details: [
      "Hand-woven natural raffia",
      "Inner cotton headband",
      "Wide 12 cm brim",
      "Crafted in Bali, finished in France",
    ],
    origin: "Bali",
  },
  {
    slug: "noir-fedora",
    name: "Noir — Fedora",
    collection: "Sunburn",
    category: "hats",
    tags: ["fedora", "felted wool"],
    onSale: true,
    priceEUR: 260,
    priceUSD: 285,
    priceIDR: 4_550_000,
    image: p2,
    story:
      "An ink-dipped fedora made for Parisian rooftops and quiet exits from beach clubs.",
    details: [
      "Plant-dyed raffia (charcoal)",
      "Pinched crown",
      "Grosgrain interior band",
      "Atelier France",
    ],
    origin: "France",
  },
  {
    slug: "ubud-bucket",
    name: "Ubud — Bucket",
    collection: "Juicy Record",
    category: "hats",
    tags: ["bucket", "bob", "kids", "surf hat"],
    priceEUR: 180,
    priceUSD: 195,
    priceIDR: 3_150_000,
    image: p3,
    story:
      "Soft, sculpted, easy. The bucket reimagined in crocheted natural straw.",
    details: ["Crocheted raffia", "Packable", "Inner sweatband", "Made in Bali"],
    origin: "Bali",
  },
  {
    slug: "riviera-cowboy",
    name: "Riviera — Cowboy",
    collection: "Mi Paradisio",
    category: "hats",
    tags: ["cowboy", "sand", "felted wool"],
    onSale: true,
    priceEUR: 290,
    priceUSD: 315,
    priceIDR: 5_050_000,
    image: p4,
    story:
      "A cream silhouette cut between Aix and Seminyak. The cowboy, gone coastal.",
    details: [
      "Compressed natural straw",
      "Vegetal leather trim",
      "Pencil curl brim",
      "Atelier France",
    ],
    origin: "France",
  },
];

export const collections = [
  { slug: "sunburn", name: "Sunburn", season: "Fall/Winter 2025" },
  { slug: "juicy-record", name: "Juicy Record", season: "Capsule" },
  { slug: "mi-paradisio", name: "Mi Paradisio", season: "New — Spring 2026" },
  { slug: "endless-summer", name: "Endless Summer", season: "Permanent" },
];
