import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Search, ShoppingBag, User, Menu, X, Globe } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCurrency, COUNTRIES } from "@/lib/currency";

export function Header() {
  const { count, setOpen } = useCart();
  const { country, setCountry } = useCurrency();
  const [menu, setMenu] = useState(false);
  const [geo, setGeo] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60">
      <div className="grid grid-cols-3 items-center px-5 md:px-10 h-16 md:h-20">
        <nav className="flex items-center gap-7 text-sm">
          <button
            className="md:hidden"
            onClick={() => setMenu(true)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/collection" className="hidden md:inline link-underline">Shop</Link>
          <Link to="/collection" search={{ c: "sunburn" } as never} className="hidden md:inline link-underline">Sunburn</Link>
          <Link to="/about" className="hidden md:inline link-underline">Atelier</Link>
        </nav>

        <Link to="/" className="text-center font-display text-xl md:text-2xl tracking-tight">
          Bing in Diaries
        </Link>

        <div className="flex items-center justify-end gap-4 md:gap-5 text-sm">
          <button onClick={() => setGeo((v) => !v)} className="hidden md:flex items-center gap-1.5 link-underline">
            <Globe className="size-4" />
            <span>{country.code} / {country.currency}</span>
          </button>
          <Link to="/account" aria-label="Account"><User className="size-5" /></Link>
          <Link to="/account" search={{ tab: "wishlist" } as never} aria-label="Wishlist" className="hidden md:inline">
            <Heart className="size-5" />
          </Link>
          <button aria-label="Search" className="hidden md:inline"><Search className="size-5" /></button>
          <button onClick={() => setOpen(true)} aria-label="Cart" className="relative">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-ink text-bone text-[10px] rounded-full size-4 flex items-center justify-center font-mono">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Geo selector */}
      {geo && (
        <div className="absolute right-5 md:right-10 top-full mt-2 bg-popover border border-border shadow-2xl p-5 w-72 animate-fade-in">
          <p className="text-eyebrow text-muted-foreground mb-3">Ship to</p>
          <ul className="space-y-1.5">
            {COUNTRIES.map((c) => (
              <li key={c.code}>
                <button
                  onClick={() => { setCountry(c); setGeo(false); }}
                  className={`w-full flex items-center justify-between text-sm py-1.5 px-2 hover:bg-muted transition ${country.code === c.code ? "bg-muted" : ""}`}
                >
                  <span>{c.flag} {c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{c.currency}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mobile menu */}
      {menu && (
        <div className="fixed inset-0 z-50 bg-background animate-fade-in flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <span className="font-display text-xl">Menu</span>
            <button onClick={() => setMenu(false)} aria-label="Close"><X className="size-5" /></button>
          </div>
          <nav className="flex flex-col p-8 gap-6 text-3xl font-display" onClick={() => setMenu(false)}>
            <Link to="/collection">Shop all</Link>
            <Link to="/collection" search={{ c: "sunburn" } as never}>Sunburn</Link>
            <Link to="/about">Atelier</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/account">Account</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
