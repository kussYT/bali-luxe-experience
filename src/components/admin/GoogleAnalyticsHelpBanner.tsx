import { Link } from "@tanstack/react-router";

const GA_URL = "https://analytics.google.com";
const GA_ACCOUNT = "bingindiaries@gmail.com";
const GA_MEASUREMENT_ID = "G-MLQM9Q4KBF";

type GoogleAnalyticsHelpBannerProps = {
  /** Shorter copy for compact layouts (e.g. dashboard). */
  compact?: boolean;
};

export function GoogleAnalyticsHelpBanner({ compact = false }: GoogleAnalyticsHelpBannerProps) {
  return (
    <div
      role="note"
      className="rounded-sm border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-medium">
        {compact ? "Trafic site (visiteurs, pages, Instagram)" : "Où voir le trafic ?"}
      </p>
      {compact ? (
        <p className="mt-1 text-muted-foreground">
          Préférez :{" "}
          <Link to="/admin/analytics/traffic" className="link-underline text-foreground hover:text-accent">
            Trafic site
          </Link>{" "}
          dans l’admin (compte aussi Instagram). Optionnel :{" "}
          <a
            href={GA_URL}
            target="_blank"
            rel="noreferrer"
            className="link-underline text-foreground hover:text-accent"
          >
            Google Analytics
          </a>{" "}
          avec <span className="font-medium text-foreground">{GA_ACCOUNT}</span>.
        </p>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Pour le trafic global (y compris Instagram), ouvrez{" "}
            <Link to="/admin/analytics/traffic" className="link-underline text-foreground">
              Trafic site
            </Link>{" "}
            dans l’admin. Google Analytics reste utile hors app Instagram, mais sous-compte souvent
            les clics IG.
          </p>
          <ul className="mt-3 space-y-1 text-muted-foreground">
            <li>
              <span className="text-foreground/80">Admin :</span>{" "}
              <Link to="/admin/analytics/traffic" className="link-underline text-foreground">
                /admin/analytics/traffic
              </Link>
            </li>
            <li>
              <span className="text-foreground/80">Google Analytics :</span>{" "}
              <a
                href={GA_URL}
                target="_blank"
                rel="noreferrer"
                className="link-underline text-foreground hover:text-accent"
              >
                {GA_URL}
              </a>{" "}
              — compte <span className="font-medium text-foreground">{GA_ACCOUNT}</span> (
              {GA_MEASUREMENT_ID})
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
