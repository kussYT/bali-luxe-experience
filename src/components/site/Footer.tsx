import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/site/NewsletterForm";
import { MarketSelector } from "@/components/site/MarketSelector";
import { CookiePreferencesLink } from "@/components/site/CookieConsent";
import { SocialIconLinks } from "@/components/site/SocialIconLinks";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-sm space-y-3">
      <p className="text-eyebrow !text-surface/50 mb-5">{title}</p>
      {children}
    </div>
  );
}

function FooterLink({
  to,
  search,
  hash,
  children,
}: {
  to: string;
  search?: Record<string, string>;
  hash?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      hash={hash}
      className="block link-underline text-surface/85 hover:text-surface"
    >
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 md:mt-28 bg-foreground text-surface">
      <div className="page-wrap section-pad section-gap grid md:grid-cols-12 gap-12 md:gap-8 lg:gap-10">
        <div className="md:col-span-12 lg:col-span-4">
          <NewsletterForm source="footer" variant="footer" />
          <div className="mt-6">
            <MarketSelector variant="footer" />
          </div>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title="Shop">
            <FooterLink to="/collection">All pieces</FooterLink>
            <FooterLink to="/collection" search={{ sale: "true" }}>
              Sale
            </FooterLink>
            <FooterLink to="/account" search={{ tab: "wishlist" }}>
              Wishlist
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title="Customer care">
            <FooterLink to="/contact">Contact us</FooterLink>
            <FooterLink to="/sizing">Size guide</FooterLink>
            <FooterLink to="/care">Care guide</FooterLink>
            <FooterLink to="/contact">FAQ</FooterLink>
            <FooterLink to="/shipping">Shipping</FooterLink>
            <FooterLink to="/returns">Return policy</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title="Explore">
            <FooterLink to="/about">The brand</FooterLink>
            <FooterLink to="/travel-diaries">Travel guide</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title="Privacy">
            <div>
              <CookiePreferencesLink />
            </div>
            <FooterLink to="/contact">Terms &amp; conditions</FooterLink>
            <FooterLink to="/about" hash="artisans">
              Artisans &amp; ethics
            </FooterLink>
            <FooterLink to="/about" hash="quality">
              Materials &amp; quality
            </FooterLink>
          </FooterColumn>
        </div>
      </div>

      <div className="page-wrap section-pad py-8 border-t border-surface/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-eyebrow !text-surface/45">© 2026 Bingin Diaries</p>
        <SocialIconLinks iconClassName="size-4" className="[&_a]:!text-surface/70 [&_a:hover]:!text-surface" />
      </div>
    </footer>
  );
}
