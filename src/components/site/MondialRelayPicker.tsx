import { useEffect, useId, useRef } from "react";
import type { MondialRelayPickup } from "@/lib/mondial-relay";

type MondialRelayPickerProps = {
  brandId: string;
  countryCode: string;
  language?: string;
  onSelect: (pickup: MondialRelayPickup) => void;
};

type MrParcelShopData = {
  ID?: string;
  Nom?: string;
  Adresse1?: string;
  Adresse2?: string;
  CP?: string;
  Ville?: string;
  Pays?: string;
};

declare global {
  interface Window {
    jQuery?: {
      fn: { MR_ParcelShopPicker?: (opts: Record<string, unknown>) => void };
      (selector: string): {
        empty: () => unknown;
        MR_ParcelShopPicker: (opts: Record<string, unknown>) => void;
      };
    };
  }
}

const SCRIPT_SRCS = [
  "https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js",
];

const STYLE_HREFS = [
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.css",
];

function loadCss(href: string) {
  if (document.querySelector(`link[data-mr-css="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.dataset.mrCss = href;
  document.head.appendChild(link);
}

function loadScript(src: string) {
  const existing = document.querySelector(`script[data-mr-src="${src}"]`) as HTMLScriptElement | null;
  if (existing) {
    return existing.dataset.loaded === "1"
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error(`Failed ${src}`)));
        });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.mrSrc = src;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

async function ensureMondialRelayWidget() {
  for (const href of STYLE_HREFS) loadCss(href);
  for (const src of SCRIPT_SRCS) {
    await loadScript(src);
  }
}

export function MondialRelayPicker({
  brandId,
  countryCode,
  language = "fr",
  onSelect,
}: MondialRelayPickerProps) {
  const reactId = useId().replace(/:/g, "");
  const zoneId = `mr-zone-${reactId}`;
  const targetId = `mr-target-${reactId}`;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    ensureMondialRelayWidget()
      .then(() => {
        if (cancelled || !window.jQuery?.fn?.MR_ParcelShopPicker) return;
        const $ = window.jQuery;
        const $zone = $(`#${zoneId}`);
        $zone.empty();
        $zone.MR_ParcelShopPicker({
          Target: `#${targetId}`,
          Brand: brandId,
          Country: countryCode.toUpperCase(),
          AllowedCountries: countryCode.toUpperCase(),
          Responsive: true,
          ShowResultsOnMap: true,
          DisplayMapInfo: true,
          EnableGeolocalisatedSearch: true,
          NbResults: 7,
          Language: language,
          OnParcelShopSelected: (data: MrParcelShopData) => {
            const id = String(data?.ID || "").trim();
            if (!id) return;
            onSelectRef.current({
              id,
              name: String(data.Nom || "").trim() || `Point Relais ${id}`,
              line1: String(data.Adresse1 || "").trim(),
              line2: String(data.Adresse2 || "").trim() || undefined,
              postalCode: String(data.CP || "").trim(),
              city: String(data.Ville || "").trim(),
              country: String(data.Pays || countryCode).trim().toUpperCase() || countryCode,
            });
          },
        });
      })
      .catch((err) => {
        console.error("[mondial-relay] widget load failed", err);
      });

    return () => {
      cancelled = true;
      try {
        const el = document.getElementById(zoneId);
        if (el) el.innerHTML = "";
      } catch {
        /* ignore */
      }
    };
  }, [brandId, countryCode, language, zoneId, targetId]);

  return (
    <div className="space-y-2">
      <input id={targetId} type="hidden" readOnly />
      <div
        id={zoneId}
        className="min-h-[320px] border border-border bg-background overflow-hidden rounded-sm"
      />
      <p className="text-caption text-muted-foreground">
        Recherchez un Point Relais près de chez vous, puis sélectionnez-le sur la carte ou dans la liste.
      </p>
    </div>
  );
}
