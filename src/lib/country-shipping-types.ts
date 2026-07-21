export type CountryShippingRow = {
  code: string;
  name: string;
  currency: "EUR" | "USD" | "IDR";
  continent: "europe" | "americas" | "asia-pacific" | "indonesia";
  enabled: boolean;
  warehouse: "france" | "bali";
  shippingPrice: number;
};

export type CountryShippingConfig = {
  countries: Record<
    string,
    {
      enabled: boolean;
      warehouse: "france" | "bali";
      shippingPrice: number;
    }
  >;
};
