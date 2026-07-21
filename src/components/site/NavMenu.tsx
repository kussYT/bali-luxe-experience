import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { focalObjectPosition } from "@/lib/image-focal";
import type { NavColumn, NavFeaturedImage } from "@/lib/navigation";
import { getMegaMenuContent, type MegaMenuId } from "@/lib/navigation";
import { useRegionalCatalog } from "@/lib/use-regional-catalog";
import { useSiteContent } from "@/lib/content-context";
import { BrandLogo } from "@/components/site/BrandLogo";
import { CurrencySelector } from "@/components/site/CurrencySelector";

type NavSection = {
  label: string;
  mega: MegaMenuId;
};

type NavMenuProps = {
  open: boolean;
  onClose: () => void;
  sections: readonly NavSection[];
};

/** Same typography as desktop navbar + mega-menu links */
const navMainClass =
  "text-[0.6875rem] font-medium tracking-[0.22em] uppercase text-foreground/80 group-hover:text-foreground transition-colors duration-[450ms]";
const navSubLinkClass =
  "text-sm leading-snug text-foreground/85 hover:text-foreground transition-colors duration-300";

function MegaColumn({ column, onClose }: { column: NavColumn; onClose: () => void }) {
  return (
    <div>
      <p className="text-eyebrow mb-4">{column.title}</p>
      <ul className="space-y-2.5 md:space-y-3">
        {column.items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              search={item.search as never}
              hash={item.hash}
              onClick={onClose}
              className={navSubLinkClass}
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
    <Link
      to={item.to}
      search={item.search as never}
      hash={item.hash}
      onClick={onClose}
      className="group block"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={item.image}
          alt=""
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: focalObjectPosition(item.imageFocal) }}
          loading="lazy"
        />
      </div>
      <p className="text-eyebrow mt-2.5 text-foreground/70 group-hover:text-foreground transition-colors">
        {item.label}
      </p>
    </Link>
  );
}

function MegaMobilePanel({
  label,
  columns,
  featured,
  onBack,
  onClose,
}: {
  label: string;
  columns: NavColumn[];
  featured: NavFeaturedImage[];
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-eyebrow hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        Menu
      </button>

      <p className={`${navMainClass} mb-8 text-foreground`}>{label}</p>

      <div className="space-y-8">
        {columns.map((column) => (
          <MegaColumn key={column.title} column={column} onClose={onClose} />
        ))}
      </div>

      {featured.length > 0 && (
        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-eyebrow mb-4">Explore</p>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((item) => (
              <FeaturedNavLink key={item.label} item={item} onClose={onClose} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function NavMenu({ open, onClose, sections }: NavMenuProps) {
  const { collections, regionalProducts } = useRegionalCatalog();
  const { homepage } = useSiteContent();
  const [activeMega, setActiveMega] = useState<MegaMenuId | null>(null);

  useEffect(() => {
    if (!open) setActiveMega(null);
  }, [open]);

  if (!open) return null;

  const activeSection = activeMega ? sections.find((s) => s.mega === activeMega) : null;
  const activeContent = activeMega
    ? getMegaMenuContent(activeMega, collections, regionalProducts, homepage.megaMenuFeatured)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <aside className="w-full max-w-lg bg-background flex flex-col h-full shadow-2xl animate-fade-in overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <BrandLogo variant="compact" />
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="p-6 flex-1">
          {activeSection && activeContent ? (
            <MegaMobilePanel
              label={activeSection.label}
              columns={activeContent.columns}
              featured={activeContent.featured}
              onBack={() => setActiveMega(null)}
              onClose={onClose}
            />
          ) : (
            <ul className="divide-y divide-border">
              {sections.map((section) => (
                <li key={section.mega}>
                  <button
                    type="button"
                    onClick={() => setActiveMega(section.mega)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left group"
                  >
                    <span className={navMainClass}>
                      {section.label}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="shrink-0 border-t border-border px-6 pt-5 pb-6">
          <p className="text-eyebrow text-muted-foreground mb-3">Currency</p>
          <CurrencySelector variant="nav" />
        </div>
      </aside>
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
    </div>
  );
}
