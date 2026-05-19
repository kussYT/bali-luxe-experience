import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 md:mt-28 bg-foreground text-surface">
      <div className="page-wrap section-pad section-gap grid md:grid-cols-12 gap-12 md:gap-10">
        <div className="md:col-span-5">
          <p className="text-eyebrow !text-surface/50">Newsletter</p>
          <h2 className="font-display text-4xl md:text-5xl mt-4 mb-8 leading-[1.05] max-w-md">
            Diaries from Bali & France.
          </h2>
          <form className="flex border-b border-surface/25 pb-3 max-w-md gap-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email"
              className="bg-transparent flex-1 outline-none text-sm placeholder:text-surface/40 font-light text-surface"
            />
            <button type="submit" className="text-eyebrow !text-accent-soft link-underline shrink-0">
              Subscribe
            </button>
          </form>
        </div>
        <div className="md:col-span-3 md:col-start-7 text-sm space-y-3">
          <p className="text-eyebrow !text-surface/50 mb-5">Shop</p>
          <Link to="/collection" className="block link-underline text-surface/85 hover:text-surface">
            All pieces
          </Link>
          <Link
            to="/collection"
            search={{ sale: "true" } as never}
            className="block link-underline text-surface/85 hover:text-surface"
          >
            Sale
          </Link>
          <Link to="/account" className="block link-underline text-surface/85 hover:text-surface">
            Wishlist
          </Link>
        </div>
        <div className="md:col-span-3 text-sm space-y-3">
          <p className="text-eyebrow !text-surface/50 mb-5">House</p>
          <Link to="/about" className="block link-underline text-surface/85 hover:text-surface">
            Atelier
          </Link>
          <Link to="/shipping" className="block link-underline text-surface/85 hover:text-surface">
            Shipping
          </Link>
          <Link to="/returns" className="block link-underline text-surface/85 hover:text-surface">
            Returns
          </Link>
          <Link to="/contact" className="block link-underline text-surface/85 hover:text-surface">
            Contact
          </Link>
        </div>
      </div>

      <div className="page-wrap section-pad py-8 border-t border-surface/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-eyebrow !text-surface/45">© 2026 Bingin Diaries</p>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="text-eyebrow !text-surface/70 link-underline hover:!text-surface"
        >
          @bingindiaries
        </a>
      </div>
    </footer>
  );
}
