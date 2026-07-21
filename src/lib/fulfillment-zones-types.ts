import type { WarehouseId } from "@/lib/catalog-types";

export type FulfillmentZones = {
  franceWarehouseCountries: string[];
  baliWarehouseCountries: string[];
  restOfWorldWarehouse: WarehouseId;
};
