import { SITE_LOCALE_CODES } from "./i18n-locales.mjs";
import { resolvePostBlocks } from "./journal-blocks.mjs";

const DEEPL_LANG = { fr: "FR", en: "EN", es: "ES", id: "ID" };

export function isTranslateConfigured() {
  return Boolean(process.env.DEEPL_API_KEY?.trim());
}

export function getTranslateStatus() {
  return {
    available: isTranslateConfigured(),
    provider: isTranslateConfigured() ? "deepl" : null,
    hint: null,
  };
}

async function translateDeepL(text, source, target, apiKey) {
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: DEEPL_LANG[source] || source.toUpperCase(),
      target_lang: DEEPL_LANG[target] || target.toUpperCase(),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL error (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.translations?.[0]?.text || text;
}

export async function translateText(text, sourceLang, targetLang) {
  const source = sourceLang?.trim().toLowerCase();
  const target = targetLang?.trim().toLowerCase();
  if (!text?.trim()) return "";
  if (!source || !target || source === target) return text;
  if (!SITE_LOCALE_CODES.includes(source) || !SITE_LOCALE_CODES.includes(target)) {
    const err = new Error("Unsupported locale");
    err.status = 400;
    throw err;
  }

  const deeplKey = process.env.DEEPL_API_KEY?.trim();
  if (!deeplKey) {
    const err = new Error(
      "Traduction indisponible : configurez DEEPL_API_KEY (compte gratuit DeepL, ~500k caractères/mois).",
    );
    err.status = 503;
    throw err;
  }

  return translateDeepL(text, source, target, deeplKey);
}

export async function translatePageLocales({ sourceLocale, targetLocales, fields }) {
  const source = sourceLocale?.trim().toLowerCase();
  const targets = (targetLocales || []).filter((t) => t && t !== source);
  if (!source || !SITE_LOCALE_CODES.includes(source)) {
    const err = new Error("Invalid source locale");
    err.status = 400;
    throw err;
  }
  if (!fields?.title?.trim()) {
    const err = new Error("Source title is required");
    err.status = 400;
    throw err;
  }
  if (!isTranslateConfigured()) {
    const err = new Error("Traduction indisponible : configurez DEEPL_API_KEY.");
    err.status = 503;
    throw err;
  }

  const out = {};

  for (const target of targets) {
    if (!SITE_LOCALE_CODES.includes(target)) continue;
    const body = Array.isArray(fields.body) ? fields.body : [];
    const translatedBody = [];
    for (const paragraph of body) {
      translatedBody.push(paragraph?.trim() ? await translateText(paragraph, source, target) : "");
    }

    out[target] = {
      title: await translateText(fields.title, source, target),
      eyebrow: fields.eyebrow?.trim() ? await translateText(fields.eyebrow, source, target) : "",
      metaDescription: fields.metaDescription?.trim()
        ? await translateText(fields.metaDescription, source, target)
        : "",
      body: translatedBody.filter(Boolean),
    };
  }

  return { locales: out, provider: "deepl" };
}

export async function translatePostLocales({ sourceLocale, targetLocales, fields }) {
  const source = sourceLocale?.trim().toLowerCase();
  const targets = (targetLocales || []).filter((t) => t && t !== source);
  if (!source || !SITE_LOCALE_CODES.includes(source)) {
    const err = new Error("Invalid source locale");
    err.status = 400;
    throw err;
  }
  if (!fields?.title?.trim()) {
    const err = new Error("Source title is required");
    err.status = 400;
    throw err;
  }
  if (!isTranslateConfigured()) {
    const err = new Error("Traduction indisponible : configurez DEEPL_API_KEY.");
    err.status = 503;
    throw err;
  }

  const out = {};

  const sourceBlocks = resolvePostBlocks(fields);

  for (const target of targets) {
    if (!SITE_LOCALE_CODES.includes(target)) continue;

    const translatedBlocks = [];
    for (const block of sourceBlocks) {
      if (block.type === "text") {
        const paragraphs = [];
        for (const paragraph of block.paragraphs) {
          paragraphs.push(paragraph?.trim() ? await translateText(paragraph, source, target) : "");
        }
        translatedBlocks.push({ type: "text", paragraphs: paragraphs.filter(Boolean) });
      } else if (block.type === "photo") {
        translatedBlocks.push({
          type: "photo",
          image: block.image,
          imageFocal: block.imageFocal,
          alt: block.alt,
          caption: block.caption?.trim() ? await translateText(block.caption, source, target) : "",
        });
      } else if (block.type === "photoPair") {
        const translateSlot = async (slot) => ({
          image: slot.image,
          imageFocal: slot.imageFocal,
          alt: slot.alt,
          caption: slot.caption?.trim() ? await translateText(slot.caption, source, target) : "",
        });
        translatedBlocks.push({
          type: "photoPair",
          left: await translateSlot(block.left),
          right: await translateSlot(block.right),
        });
      }
    }

    out[target] = {
      title: await translateText(fields.title, source, target),
      excerpt: fields.excerpt?.trim() ? await translateText(fields.excerpt, source, target) : "",
      category: fields.category?.trim() ? await translateText(fields.category, source, target) : "",
      blocks: translatedBlocks,
      body: translatedBlocks
        .filter((b) => b.type === "text")
        .flatMap((b) => b.paragraphs),
    };
  }

  return { locales: out, provider: "deepl" };
}

export async function translateProductLocales({ sourceLocale, targetLocales, fields }) {
  const source = sourceLocale?.trim().toLowerCase();
  const targets = (targetLocales || []).filter((t) => t && t !== source);
  if (!source || !SITE_LOCALE_CODES.includes(source)) {
    const err = new Error("Invalid source locale");
    err.status = 400;
    throw err;
  }
  if (!fields?.name?.trim()) {
    const err = new Error("Source name is required");
    err.status = 400;
    throw err;
  }
  if (!isTranslateConfigured()) {
    const err = new Error("Traduction indisponible : configurez DEEPL_API_KEY.");
    err.status = 503;
    throw err;
  }

  const out = {};
  for (const target of targets) {
    if (!SITE_LOCALE_CODES.includes(target)) continue;
    out[target] = {
      name: await translateText(fields.name, source, target),
      story: fields.story?.trim() ? await translateText(fields.story, source, target) : "",
      seoTitle: fields.seoTitle?.trim() ? await translateText(fields.seoTitle, source, target) : "",
      metaDescription: fields.metaDescription?.trim()
        ? await translateText(fields.metaDescription, source, target)
        : "",
    };
  }

  return { locales: out, provider: "deepl" };
}

export async function translateProductMessagesLocales({ sourceLocale, targetLocales, fields }) {
  const source = sourceLocale?.trim().toLowerCase();
  const targets = (targetLocales || []).filter((t) => t && t !== source);
  if (!source || !SITE_LOCALE_CODES.includes(source)) {
    const err = new Error("Invalid source locale");
    err.status = 400;
    throw err;
  }
  if (!fields?.addToBag?.trim()) {
    const err = new Error("Source addToBag text is required");
    err.status = 400;
    throw err;
  }
  if (!isTranslateConfigured()) {
    const err = new Error("Traduction indisponible : configurez DEEPL_API_KEY.");
    err.status = 503;
    throw err;
  }

  const keys = ["regionalUnavailable", "soldOut", "unavailableInRegion", "addToBag", "inStock"];
  const out = {};
  for (const target of targets) {
    if (!SITE_LOCALE_CODES.includes(target)) continue;
    const block = {};
    for (const key of keys) {
      const text = fields[key];
      block[key] = text?.trim() ? await translateText(text, source, target) : "";
    }
    out[target] = block;
  }

  return { locales: out, provider: "deepl" };
}
