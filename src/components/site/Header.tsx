import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Search, ShoppingBag, User, Menu, Globe } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency, COUNTRIES } from "@/lib/currency";
import { NavMenu } from "@/components/site/NavMenu";
import { SearchDrawer } from "@/components/site/SearchDrawer";

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

  const openNav = () => {
    setSearchOpen(false);
    setNavOpen(true);
  };

  const openCart = () => {
    closePanels();
    setOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="grid grid-cols-3 items-center px-5 md:px-10 h-16 md:h-20">
          <nav className="flex items-center gap-5 text-sm">
            <button onClick={openNav} className="flex items-center gap-2 link-underline" aria-label="Open menu">
              <Menu className="size-5" />
              <span className="hidden md:inline text-eyebrow">Menu</span>
            </button>
          </nav>

          <Link
            to="/"
            aria-label="Bingin Diaries"
            className="flex items-center justify-center font-display text-sm md:text-base tracking-[0.08em] uppercase"
          >
            Bingin Diaries
          </Link>

          <div className="flex items-center justify-end gap-4 md:gap-5 text-sm">
            <button
              onClick={() => setGeo((v) => !v)}
              className="hidden md:flex items-center gap-1.5 link-underline"
            >
              <Globe className="size-4" />
              <span>
                {country.code} / {country.currency}
              </span>
            </button>
            <Link to="/account" aria-label="Account">
              <User className="size-5" />
            </Link>
            <Link
              to="/account"
              search={{ tab: "wishlist" } as never}
              aria-label="Wishlist"
              className="hidden md:inline"
            >
              <Heart className="size-5" />
            </Link>
            <button onClick={openSearch} aria-label="Search">
              <Search className="size-5" />
            </button>
            <button onClick={openCart} aria-label="Cart" className="relative">
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-ink text-bone text-[10px] rounded-full size-4 flex items-center justify-center font-mono">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {geo && (
          <div className="absolute right-5 md:right-10 top-full mt-2 bg-popover border border-border shadow-2xl p-5 w-72 animate-fade-in">
            <p className="text-eyebrow text-muted-foreground mb-3">Ship to</p>
            <ul className="space-y-1.5">
              {COUNTRIES.map((c) => (
                <li key={c.code}>
                  <button
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
