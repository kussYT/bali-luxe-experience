import { getShippingSettings, saveShippingSettings } from "../shipping-rates.mjs";

export async function getAdminShippingResponse() {
  const settings = await getShippingSettings();
  return { settings, source: "postgres" };
}

export async function patchAdminShipping(body) {
  if (!body?.zones || !Array.isArray(body.zones)) {
    const err = new Error("zones array required");
    err.status = 400;
    throw err;
  }
  const settings = await saveShippingSettings({ zones: body.zones });
  return { settings, source: "postgres" };
}
