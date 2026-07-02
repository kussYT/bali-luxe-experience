import { Link } from "@tanstack/react-router";
import { focalObjectPosition } from "@/lib/image-focal";
import { X } from "lucide-react";
import type { NavColumn, NavFeaturedImage } from "@/lib/navigation";
import { getMegaMenuContent, type MegaMenuId } from "@/lib/navigation";
import { useCatalog } from "@/lib/catalog-context";
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

function MegaMobileSection({
  columns,
  featured,
  onClose,
}: {
  columns: NavColumn[];
  featured: NavFeaturedImage[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {columns.map((column) => (
          <MegaColumn key={column.title} column={column} onClose={onClose} />
        ))}
      </div>
      {featured.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {featured.map((item) => (
            <FeaturedNavLink key={item.label} item={item} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

function MegaColumn({ column, onClose }: { column: NavColumn; onClose: () => void }) {
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
      <p className="text-[0.625rem] tracking-[0.18em] uppercase mt-2 text-muted-foreground">{item.label}</p>
    </Link>
  );
}

export function NavMenu({ open, onClose, sections }: NavMenuProps) {
  const { collections, publishedProducts } = useCatalog();
  const { homepage } = useSiteContent();

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

        <nav className="p-6 space-y-10 flex-1">
          {sections.map((section) => {
            const { columns, featured } = getMegaMenuContent(
              section.mega,
              collections,
              publishedProducts,
              homepage.megaMenuFeatured,
            );
            return (
              <div key={section.label} className="space-y-4">
                <p className="text-eyebrow text-muted-foreground">{section.label}</p>
                <MegaMobileSection columns={columns} featured={featured} onClose={onClose} />
              </div>
            );
          })}
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
