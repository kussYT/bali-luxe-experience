import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { NAV_ABOUT, NAV_SALES, NAV_SHOP } from "@/lib/navigation";

type NavMenuProps = {
  open: boolean;
  onClose: () => void;
};

function NavSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className="text-eyebrow text-muted-foreground">{title}</p>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function NavLinkItem({
  label,
  to,
  search,
  hash,
  onClose,
}: {
  label: string;
  to: string;
  search?: Record<string, string>;
  hash?: string;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        search={search as never}
        hash={hash}
        onClick={onClose}
        className="font-display text-2xl md:text-3xl leading-tight hover:text-clay transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}

export function NavMenu({ open, onClose }: NavMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <aside className="w-full max-w-lg bg-background flex flex-col h-full shadow-2xl animate-fade-in overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <p className="text-eyebrow text-muted-foreground">Menu</p>
          <button onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="p-6 md:p-10 space-y-12">
          <NavSection title="Shop">
            {NAV_SHOP.map((item) => (
              <NavLinkItem key={item.label} {...item} onClose={onClose} />
            ))}
          </NavSection>

          <NavSection title="Sales">
            {NAV_SALES.map((item) => (
              <NavLinkItem key={item.label} {...item} onClose={onClose} />
            ))}
          </NavSection>

          <NavSection title="About">
            {NAV_ABOUT.map((item) => (
              <NavLinkItem key={item.label} {...item} onClose={onClose} />
            ))}
          </NavSection>
        </nav>
      </aside>
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
    </div>
  );
}
