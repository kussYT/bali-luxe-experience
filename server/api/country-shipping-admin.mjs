import {
  getCountryShippingRows,
  saveCountryShippingConfig,
} from "../db/country-shipping.mjs";

export async function getAdminCountryShippingResponse() {
  const rows = await getCountryShippingRows();
  return { rows, source: "postgres" };
}

export async function patchAdminCountryShipping(body) {
  if (!body?.countries || typeof body.countries !== "object") {
    const err = new Error("countries object required");
    err.status = 400;
    throw err;
  }
  const saved = await saveCountryShippingConfig({ countries: body.countries });
  const rows = await getCountryShippingRows();
  return { countries: saved.countries, rows, source: "postgres" };
}

export async function getPublicEnabledShippingCountries() {
  const rows = await getCountryShippingRows();
  return {
    countries: rows
      .filter((r) => r.enabled)
      .map((r) => ({
        code: r.code,
        name: r.name,
        currency: r.currency,
        warehouse: r.warehouse,
        shippingPrice: r.shippingPrice,
      })),
  };
}
