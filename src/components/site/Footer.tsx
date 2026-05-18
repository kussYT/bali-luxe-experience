import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-ink text-bone mt-32">
      <div className="px-5 md:px-10 py-20 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <p className="text-eyebrow opacity-60">Bingin Club</p>
          <h2 className="font-display text-3xl md:text-5xl mt-3 mb-6 leading-tight">
            Diaries from<br />Bali & France.
          </h2>
          <form className="flex border-b border-bone/40 pb-2 max-w-md" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="bg-transparent flex-1 outline-none text-sm placeholder:text-bone/50"
            />
            <button type="submit" className="text-eyebrow link-underline">Subscribe</button>
          </form>
        </div>
        <div className="text-sm space-y-3">
          <p className="text-eyebrow opacity-60 mb-4">Shop</p>
          <Link to="/collection" className="block link-underline">All hats</Link>
          <Link to="/collection" className="block link-underline">Sunburn</Link>
          <Link to="/collection" className="block link-underline">Endless Summer</Link>
          <Link to="/account" className="block link-underline">Wishlist</Link>
        </div>
        <div className="text-sm space-y-3">
          <p className="text-eyebrow opacity-60 mb-4">House</p>
          <Link to="/about" className="block link-underline">Atelier</Link>
          <Link to="/contact" className="block link-underline">Contact</Link>
          <a className="block link-underline" href="#">Shipping & returns</a>
          <a className="block link-underline" href="#">Return portal</a>
          <a className="block link-underline" href="#">Care guide</a>
          <a className="block link-underline" href="#">Size guide</a>
        </div>
      </div>

        <div className="px-5 md:px-10 py-6 border-t border-bone/15 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-eyebrow opacity-60">© 2026 Bingin Diaries — Canggu / Paris</p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-eyebrow link-underline">
          <Instagram className="size-4" /> @bingindiaries
        </a>
      </div>
    </footer>
  );
}
