import { getFulfillmentZones, saveFulfillmentZones } from "../db/fulfillment-settings.mjs";
import { logQueryStats, resetQueryStats } from "../db/query-stats.mjs";

export async function getPublicFulfillmentZonesResponse() {
  resetQueryStats();
  const zones = await getFulfillmentZones();
  logQueryStats("GET /api/fulfillment-zones");
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
