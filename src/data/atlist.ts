/** Atlist store locator — Bingin Diaries map (override via VITE_ATLIST_EMBED_URL). */
const DEFAULT_ATLIST_EMBED =
  "https://my.atlist.com/map/eb6f5d5f-087a-4f52-934e-affcbb8d5f09?share=true";

const DEFAULT_ATLIST_MAP = "https://my.atlist.com/map/eb6f5d5f-087a-4f52-934e-affcbb8d5f09";

export const ATLIST_EMBED_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLIST_EMBED_URL?.trim()) ||
  DEFAULT_ATLIST_EMBED;

export const ATLIST_MAP_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLIST_MAP_URL?.trim()) ||
  DEFAULT_ATLIST_MAP;
