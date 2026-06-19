import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-context";
import { buildNavMain } from "@/lib/navigation";
import { BrandLogo } from "@/components/site/BrandLogo";
import { NavMenu } from "@/components/site/NavMenu";
import { NavAboutDropdown } from "@/components/site/NavAboutDropdown";
import { NavDropdown } from "@/components/site/NavDropdown";
import { SearchDrawer } from "@/components/site/SearchDrawer";
import { MarketSelector } from "@/components/site/MarketSelector";

const navLink =
  "text-[0.6875rem] font-medium tracking-[0.22em] uppercase py-2 link-underline text-foreground/80 hover:text-foreground transition-colors duration-[450ms]";

const iconBtn =
  "flex items-center justify-center size-9 text-foreground/80 hover:text-foreground transition-colors md:hidden";

export function Header() {
  const { count, setOpen } = useCart();
  const { collections, publishedProducts } = useCatalog();
  const navMain = buildNavMain(collections, publishedProducts);
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closePanels = () => {
    setNavOpen(false);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-[12px] border-b border-border/60 relative">
        <div className="page-wrap section-pad grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center h-[4.25rem] md:h-[5.25rem] gap-1.5 sm:gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-6 lg:gap-8 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setNavOpen(true);
              }}
              className="md:hidden flex items-center justify-center size-9 text-foreground/80"
              aria-label="Open menu"
            >
              <Menu className="size-[1.125rem] stroke-[1.15]" />
            </button>

            <nav className="hidden md:flex items-center gap-7 lg:gap-9" aria-label="Main">
              {navMain.map((section) =>
                section.label === "About us" ? (
                  <NavAboutDropdown key={section.label} />
                ) : (
                  <NavDropdown key={section.label} label={section.label} items={[...section.items]} />
                ),
              )}
            </nav>
          </div>

          <BrandLogo variant="header" className="px-0.5 sm:px-1 max-w-[min(100%,11rem)] sm:max-w-none" />

          <div className="flex items-center justify-end gap-1.5 sm:gap-3 md:gap-7 min-w-0">
            <div className="hidden md:block">
              <MarketSelector variant="header" />
            </div>
            <Link to="/account" className={`hidden sm:inline-block ${navLink}`}>
              Account
            </Link>
            <Link to="/account" search={{ tab: "wishlist" } as never} className={`hidden lg:inline-block ${navLink}`}>
              Wishlist
            </Link>
            <button
              type="button"
              onClick={() => {
                closePanels();
                setSearchOpen(true);
              }}
              className={`${navLink} hidden md:inline-block`}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                closePanels();
                setSearchOpen(true);
              }}
              className={iconBtn}
              aria-label="Search"
            >
              <Search className="size-[1.125rem] stroke-[1.15]" />
            </button>
            <button
              type="button"
              onClick={() => {
                closePanels();
                setOpen(true);
              }}
              className={`relative hidden md:inline-block ${navLink}`}
            >
              Bag
              {count > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[1rem] h-4 px-1 flex items-center justify-center bg-accent text-surface text-[8px] tracking-[0.15em] rounded-sm">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                closePanels();
                setOpen(true);
              }}
              className={`relative ${iconBtn}`}
              aria-label={`Bag${count > 0 ? `, ${count} items` : ""}`}
            >
              <ShoppingBag className="size-[1.125rem] stroke-[1.15]" />
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[0.875rem] h-3.5 px-0.5 flex items-center justify-center bg-accent text-surface text-[7px] tracking-[0.1em] rounded-sm">
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
