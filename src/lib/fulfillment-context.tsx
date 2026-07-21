import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { FulfillmentZones } from "@/lib/fulfillment-zones-types";
import { DEFAULT_FULFILLMENT_ZONES, normalizeFulfillmentZones } from "@/lib/fulfillment-zones-default";

type FulfillmentContextValue = {
  zones: FulfillmentZones;
  loading: boolean;
};

const FulfillmentContext = createContext<FulfillmentContextValue | null>(null);

export function FulfillmentProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<FulfillmentZones>(DEFAULT_FULFILLMENT_ZONES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fulfillment-zones")
      .then((r) => r.json())
      .then((data: { zones?: Partial<FulfillmentZones> }) => {
        setZones(normalizeFulfillmentZones(data.zones));
      })
      .catch(() => setZones(DEFAULT_FULFILLMENT_ZONES))
      .finally(() => setLoading(false));
  }, []);

  return (
    <FulfillmentContext.Provider value={{ zones, loading }}>{children}</FulfillmentContext.Provider>
  );
}

export function useFulfillment() {
  const ctx = useContext(FulfillmentContext);
  if (!ctx) throw new Error("useFulfillment must be used within FulfillmentProvider");
  return ctx;
}
