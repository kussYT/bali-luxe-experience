import { translatePageLocales } from "../translate.mjs";

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
