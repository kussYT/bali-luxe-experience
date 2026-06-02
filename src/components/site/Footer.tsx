import { Link } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/site/NewsletterForm";

import { MarketSelector } from "@/components/site/MarketSelector";

import { CookiePreferencesLink } from "@/components/site/CookieConsent";



export function Footer() {

  return (

    <footer className="mt-20 md:mt-28 bg-foreground text-surface">

      <div className="page-wrap section-pad section-gap grid md:grid-cols-12 gap-12 md:gap-10">

        <div className="md:col-span-5">

          <NewsletterForm source="footer" variant="footer" />

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

          <Link to="/find-us" className="block link-underline text-surface/85 hover:text-surface">

            Find us

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

          <div className="pt-2">

            <MarketSelector variant="footer" />

          </div>

        </div>

      </div>



      <div className="page-wrap section-pad py-8 border-t border-surface/10 flex flex-col md:flex-row items-center justify-between gap-4">

        <p className="text-eyebrow !text-surface/45">© 2026 Bingin Diaries</p>

        <div className="flex flex-wrap items-center justify-center gap-6">

          <CookiePreferencesLink />

          <a

            href="https://www.instagram.com/bingindiaries/"

            target="_blank"

            rel="noreferrer"

            className="text-eyebrow !text-surface/70 link-underline hover:!text-surface"

          >

            @bingindiaries

          </a>

        </div>

      </div>

    </footer>

  );

}


