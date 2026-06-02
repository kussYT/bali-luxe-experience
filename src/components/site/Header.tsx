import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-context";
import { buildNavMain } from "@/lib/navigation";
import { NavMenu } from "@/components/site/NavMenu";
import { NavDropdown } from "@/components/site/NavDropdown";
import { SearchDrawer } from "@/components/site/SearchDrawer";
import { MarketSelector } from "@/components/site/MarketSelector";

const navLink =
  "text-[0.6875rem] font-medium tracking-[0.22em] uppercase py-2 link-underline text-foreground/80 hover:text-foreground transition-colors duration-[450ms]";

export function Header() {
  const { count, setOpen } = useCart();
  const { collections } = useCatalog();
  const navMain = buildNavMain(collections);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closePanels = () => {
    setNavOpen(false);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-[12px] border-b border-border/80 relative">
        <div className="page-wrap section-pad grid grid-cols-[1fr_auto_1fr] items-center h-[4.25rem] md:h-[5.25rem] gap-4">
          <div className="flex items-center gap-5 md:gap-10 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setNavOpen(true);
              }}
              className="md:hidden flex items-center text-foreground/80"
              aria-label="Open menu"
            >
              <Menu className="size-[1.125rem] stroke-[1.15]" />
            </button>

            <nav className="hidden md:flex items-center gap-7 lg:gap-9" aria-label="Main">
              {navMain.map((section) => (
                <NavDropdown key={section.label} label={section.label} items={[...section.items]} />
              ))}
            </nav>
          </div>

          <Link to="/" aria-label="Bingin Diaries" className="flex flex-col items-center shrink-0 text-center">
            <span className="font-display text-[1.35rem] md:text-[1.65rem] tracking-[0.04em] leading-none">
              Bingin Diaries
            </span>
          </Link>

          <div className="flex items-center justify-end gap-5 md:gap-7 min-w-0">
            <MarketSelector variant="header" />
            <Link to="/account" className={`hidden sm:inline ${navLink}`}>
              Account
            </Link>
            <Link to="/account" search={{ tab: "wishlist" } as never} className={`hidden lg:inline ${navLink}`}>
              Wishlist
            </Link>
            <button type="button" onClick={() => { closePanels(); setSearchOpen(true); }} className={navLink}>
              Search
            </button>
            <button
              type="button"
              onClick={() => { closePanels(); setOpen(true); }}
              className={`relative ${navLink}`}
            >
              Bag
              {count > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[1rem] h-4 px-1 flex items-center justify-center bg-accent text-surface text-[8px] tracking-[0.15em] rounded-sm">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <NavMenu open={navOpen} onClose={() => setNavOpen(false)} sections={navMain} />
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
