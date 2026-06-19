/** Atlist map — set VITE_ATLIST_EMBED_URL / ATLIST_EMBED_URL when Béatrice provides the embed from atlist.com */
export const ATLIST_EMBED_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLIST_EMBED_URL?.trim()) || "";

export const ATLIST_MAP_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_ATLIST_MAP_URL?.trim()) ||
  "https://create.atlist.com/";
