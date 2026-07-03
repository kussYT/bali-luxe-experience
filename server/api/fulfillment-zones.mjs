import { getFulfillmentZones, saveFulfillmentZones } from "../db/fulfillment-settings.mjs";

export async function getPublicFulfillmentZonesResponse() {
  const zones = await getFulfillmentZones();
  return { zones };
}

export async function getAdminFulfillmentZonesResponse() {
  const zones = await getFulfillmentZones();
  return { zones, source: "postgres" };
}

export async function patchAdminFulfillmentZones(body) {
  const zones = await saveFulfillmentZones({
    franceWarehouseCountries: body.franceWarehouseCountries,
    baliWarehouseCountries: body.baliWarehouseCountries,
    restOfWorldWarehouse: body.restOfWorldWarehouse,
  });
  return { zones, source: "postgres" };
}
