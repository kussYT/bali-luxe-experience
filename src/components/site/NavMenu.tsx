import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { NAV_MAIN } from "@/lib/navigation";

type NavMenuProps = {
  open: boolean;
  onClose: () => void;
};

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
        className="font-display text-xl leading-tight hover:text-clay transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}

export function NavMenu({ open, onClose }: NavMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <aside className="w-full max-w-lg bg-background flex flex-col h-full shadow-2xl animate-fade-in overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <p className="text-eyebrow text-muted-foreground">Menu</p>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="p-6 space-y-10">
          {NAV_MAIN.map((section) => (
            <div key={section.label} className="space-y-4">
              <p className="text-eyebrow text-muted-foreground">{section.label}</p>
              <ul className="space-y-2.5">
                {section.items.map((item) => (
                  <NavLinkItem key={`${section.label}-${item.label}`} {...item} onClose={onClose} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
    </div>
  );
}
