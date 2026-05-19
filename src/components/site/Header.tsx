import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency, COUNTRIES } from "@/lib/currency";
import { NAV_MAIN } from "@/lib/navigation";
import { NavMenu } from "@/components/site/NavMenu";
import { NavDropdown } from "@/components/site/NavDropdown";
import { SearchDrawer } from "@/components/site/SearchDrawer";

const textLink =
  "text-sm py-2 link-underline whitespace-nowrap hover:text-ink text-foreground/90 transition-colors";

export function Header() {
  const { count, setOpen } = useCart();
  const { country, setCountry } = useCurrency();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [geo, setGeo] = useState(false);

  const closePanels = () => {
    setNavOpen(false);
    setSearchOpen(false);
  };

  const openSearch = () => {
    closePanels();
    setSearchOpen(true);
  };

  const openCart = () => {
    closePanels();
    setOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10 h-16 md:h-20 gap-4">
          {/* Left — mobile burger + desktop main nav */}
          <div className="flex items-center gap-4 md:gap-7 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setNavOpen(true);
              }}
              className="md:hidden flex items-center gap-2"
              aria-label="Open menu"
            >
              <Menu className="size-5 shrink-0" />
            </button>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main">
              {NAV_MAIN.map((section) => (
                <NavDropdown key={section.label} label={section.label} items={[...section.items]} />
              ))}
            </nav>
          </div>

          {/* Center — logo */}
          <Link
            to="/"
            aria-label="Bingin Diaries"
            className="flex items-center justify-center font-display text-sm md:text-base tracking-[0.08em] uppercase shrink-0"
          >
            Bingin Diaries
          </Link>

          {/* Right — text actions */}
          <div className="flex items-center justify-end gap-3 sm:gap-4 md:gap-5 text-sm min-w-0">
            <button
              type="button"
              onClick={() => setGeo((v) => !v)}
              className={`hidden lg:inline ${textLink}`}
            >
              {country.code} / {country.currency}
            </button>

            <Link to="/account" className={`hidden sm:inline ${textLink}`}>
              Account
            </Link>

            <Link
              to="/account"
              search={{ tab: "wishlist" } as never}
              className={`hidden md:inline ${textLink}`}
            >
              Wishlist
            </Link>

            <button type="button" onClick={openSearch} className={textLink}>
              Search
            </button>

            <button type="button" onClick={openCart} className={`relative ${textLink}`}>
              Cart
              {count > 0 && (
                <span className="absolute -top-2 -right-3 bg-ink text-bone text-[10px] rounded-full min-w-4 h-4 px-1 flex items-center justify-center font-mono">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {geo && (
          <div className="absolute right-5 md:right-10 top-full mt-2 bg-popover border border-border shadow-2xl p-5 w-72 animate-fade-in z-50">
            <p className="text-eyebrow text-muted-foreground mb-3">Ship to</p>
            <ul className="space-y-1.5">
              {COUNTRIES.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountry(c);
                      setGeo(false);
                    }}
                    className={`w-full flex items-center justify-between text-sm py-1.5 px-2 hover:bg-muted transition ${country.code === c.code ? "bg-muted" : ""}`}
                  >
                    <span>
                      {c.flag} {c.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{c.currency}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <NavMenu open={navOpen} onClose={() => setNavOpen(false)} />
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
