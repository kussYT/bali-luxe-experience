import { SITE_LOCALE_CODES } from "./i18n-locales.mjs";

const DEEPL_LANG = { fr: "FR", en: "EN", es: "ES", id: "ID" };

export function isTranslateConfigured() {
  return Boolean(process.env.DEEPL_API_KEY?.trim());
}

export function getTranslateStatus() {
  return {
    available: isTranslateConfigured(),
    provider: isTranslateConfigured() ? "deepl" : null,
    hint: isTranslateConfigured()
      ? null
      : "Ajoutez DEEPL_API_KEY dans les secrets (gratuit ~500 000 caractères/mois sur deepl.com/pro-api).",
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
    const err = new Error(getTranslateStatus().hint || "Translation not configured");
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
