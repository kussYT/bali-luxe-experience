import { Link } from "@tanstack/react-router";
import { NAV_ABOUT_COLUMNS, NAV_ABOUT_FEATURED } from "@/lib/navigation";

type NavAboutBandProps = {
  onNavigate?: () => void;
  className?: string;
};

export function NavAboutBand({ onNavigate, className = "" }: NavAboutBandProps) {
  const close = () => onNavigate?.();

  return (
    <div
      className={`border-b border-border bg-secondary/90 backdrop-blur-sm animate-fade-in shadow-[0_24px_48px_-20px_rgba(28,26,23,0.12)] ${className}`}
    >
      <div className="page-wrap section-pad py-10 md:py-12 lg:py-14">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-14 xl:gap-20 items-start">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 lg:gap-14 xl:gap-16">
            {NAV_ABOUT_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-eyebrow text-foreground/45 mb-4 md:mb-5">{column.title}</p>
                <ul className="space-y-2.5 md:space-y-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        search={item.search as never}
                        hash={item.hash}
                        onClick={close}
                        className="text-sm md:text-[0.9375rem] leading-snug text-foreground/85 hover:text-foreground transition-colors duration-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-3 xl:gap-4 w-[min(100%,26rem)] xl:w-[28rem] shrink-0">
            {NAV_ABOUT_FEATURED.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                onClick={close}
                className="group block"
              >
                <div className="aspect-[4/3] overflow-hidden bg-white border border-border/60">
                  <img
                    src={item.image}
                    alt=""
                    className="size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <p className="text-eyebrow mt-2.5 text-foreground/70 group-hover:text-foreground transition-colors">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
