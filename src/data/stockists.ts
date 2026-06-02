import data from "./stockists.json";

export type StockistStore = {
  name: string;
  instagram?: string;
  url?: string;
};

export type StockistArea = {
  name: string;
  stores: StockistStore[];
};

export type StockistCountry = {
  country: string;
  areas: StockistArea[];
};

export type StockistsData = {
  source: string;
  syncedAt: string;
  heroImage: string;
  wholesaleEmail: string;
  countries: StockistCountry[];
};

export const STOCKISTS = data as StockistsData;
