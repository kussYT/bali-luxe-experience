import { translatePageLocales, translatePostLocales, translateProductLocales, getTranslateStatus } from "../translate.mjs";

export async function getAdminTranslateStatusResponse() {
  return getTranslateStatus();
}

export async function postAdminTranslatePage(body) {
  const sourceLocale = typeof body.sourceLocale === "string" ? body.sourceLocale : "";
  const targetLocales = Array.isArray(body.targetLocales) ? body.targetLocales : [];
  const fields = body.fields && typeof body.fields === "object" ? body.fields : null;

  if (!fields) {
    const err = new Error("fields object required");
    err.status = 400;
    throw err;
  }

  return translatePageLocales({
    sourceLocale,
    targetLocales,
    fields: {
      title: typeof fields.title === "string" ? fields.title : "",
      eyebrow: typeof fields.eyebrow === "string" ? fields.eyebrow : "",
      metaDescription: typeof fields.metaDescription === "string" ? fields.metaDescription : "",
      body: Array.isArray(fields.body) ? fields.body : [],
    },
  });
}

export async function postAdminTranslatePost(body) {
  const sourceLocale = typeof body.sourceLocale === "string" ? body.sourceLocale : "";
  const targetLocales = Array.isArray(body.targetLocales) ? body.targetLocales : [];
  const fields = body.fields && typeof body.fields === "object" ? body.fields : null;

  if (!fields) {
    const err = new Error("fields object required");
    err.status = 400;
    throw err;
  }

  return translatePostLocales({
    sourceLocale,
    targetLocales,
    fields: {
      title: typeof fields.title === "string" ? fields.title : "",
      excerpt: typeof fields.excerpt === "string" ? fields.excerpt : "",
      category: typeof fields.category === "string" ? fields.category : "",
      body: Array.isArray(fields.body) ? fields.body : [],
    },
  });
}

export async function postAdminTranslateProduct(body) {
  const sourceLocale = typeof body.sourceLocale === "string" ? body.sourceLocale : "";
  const targetLocales = Array.isArray(body.targetLocales) ? body.targetLocales : [];
  const fields = body.fields && typeof body.fields === "object" ? body.fields : null;

  if (!fields) {
    const err = new Error("fields object required");
    err.status = 400;
    throw err;
  }

  return translateProductLocales({
    sourceLocale,
    targetLocales,
    fields: {
      name: typeof fields.name === "string" ? fields.name : "",
      story: typeof fields.story === "string" ? fields.story : "",
      seoTitle: typeof fields.seoTitle === "string" ? fields.seoTitle : "",
      metaDescription: typeof fields.metaDescription === "string" ? fields.metaDescription : "",
    },
  });
}
