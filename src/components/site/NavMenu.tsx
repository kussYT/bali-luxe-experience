import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { NavLink, NavColumn, NavFeaturedImage } from "@/lib/navigation";
import { NAV_ABOUT_COLUMNS, NAV_ABOUT_FEATURED } from "@/lib/navigation";
import { BrandLogo } from "@/components/site/BrandLogo";
import { MarketSelector } from "@/components/site/MarketSelector";

type NavSection = { label: string; items: readonly NavLink[] };

type NavMenuProps = {
  open: boolean;
  onClose: () => void;
  sections: readonly NavSection[];
};

function NavLinkItem({
  label,
  to,
  search,
  hash,
  onClose,
}: NavLink & { onClose: () => void }) {
  return (
    <li>
      <Link
        to={to}
        search={search as never}
        hash={hash}
        onClick={onClose}
        className="font-display text-xl leading-tight hover:text-clay transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}

function AboutMobileSection({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {NAV_ABOUT_COLUMNS.map((column) => (
          <AboutColumn key={column.title} column={column} onClose={onClose} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {NAV_ABOUT_FEATURED.map((item) => (
          <FeaturedNavLink key={item.label} item={item} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

function AboutColumn({ column, onClose }: { column: NavColumn; onClose: () => void }) {
  return (
    <div>
      <p className="text-[0.625rem] tracking-[0.2em] uppercase text-muted-foreground mb-3">{column.title}</p>
      <ul className="space-y-2">
        {column.items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              search={item.search as never}
              hash={item.hash}
              onClick={onClose}
              className="font-display text-lg leading-tight hover:text-clay transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturedNavLink({ item, onClose }: { item: NavFeaturedImage; onClose: () => void }) {
  return (
    <Link to={item.to} hash={item.hash} onClick={onClose} className="group block">
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={item.image}
          alt=""
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <p className="text-[0.625rem] tracking-[0.18em] uppercase mt-2 text-muted-foreground">{item.label}</p>
    </Link>
  );
}

export function NavMenu({ open, onClose, sections }: NavMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <aside className="w-full max-w-lg bg-background flex flex-col h-full shadow-2xl animate-fade-in overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <BrandLogo variant="compact" />
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="p-6 space-y-10">
          <div className="space-y-3 pb-6 border-b border-border">
            <p className="text-eyebrow text-muted-foreground">Ship to</p>
            <MarketSelector variant="nav" />
          </div>

          {sections.map((section) => (
            <div key={section.label} className="space-y-4">
              <p className="text-eyebrow text-muted-foreground">{section.label}</p>
              {section.label === "About us" ? (
                <AboutMobileSection onClose={onClose} />
              ) : (
                <ul className="space-y-2.5">
                  {section.items.map((item) => (
                    <NavLinkItem key={`${section.label}-${item.label}`} {...item} onClose={onClose} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
    </div>
  );
}
