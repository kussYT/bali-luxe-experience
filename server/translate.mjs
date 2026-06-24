import { SITE_LOCALE_CODES } from "./i18n-locales.mjs";

const DEEPL_LANG = { fr: "FR", en: "EN", es: "ES", id: "ID" };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function chunkText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let rest = text;
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(" ", maxLen);
    if (cut < maxLen * 0.5) cut = maxLen;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
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

async function translateMyMemory(text, source, target) {
  const chunks = chunkText(text, 450);
  const parts = [];
  for (const chunk of chunks) {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", chunk);
    url.searchParams.set("langpair", `${source}|${target}`);
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || "MyMemory translation failed");
    }
    parts.push(data.responseData?.translatedText || chunk);
    await sleep(250);
  }
  return parts.join(" ");
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
  if (deeplKey) {
    try {
      return await translateDeepL(text, source, target, deeplKey);
    } catch (e) {
      console.warn("[translate] DeepL failed, falling back to MyMemory:", e.message);
    }
  }

  return translateMyMemory(text, source, target);
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

  const provider = process.env.DEEPL_API_KEY?.trim() ? "deepl" : "mymemory";
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

  return { locales: out, provider };
}
