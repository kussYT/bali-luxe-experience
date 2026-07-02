import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/site/NewsletterForm";
import { CookiePreferencesLink } from "@/components/site/CookieConsent";
import { SocialIconLinks } from "@/components/site/SocialIconLinks";
import { useSiteContent } from "@/lib/content-context";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-sm space-y-3">
      <p className="text-eyebrow !text-surface/65 mb-5">{title}</p>
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
  const { footer } = useSiteContent();

  return (
    <footer className="mt-20 md:mt-28 bg-foreground text-surface">
      <div className="page-wrap section-pad section-gap grid md:grid-cols-12 gap-12 md:gap-8 lg:gap-10">
        <div className="md:col-span-12 lg:col-span-4">
          <NewsletterForm source="footer" variant="footer" />
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title={footer.shopTitle}>
            <FooterLink to="/collection">{footer.shopAll}</FooterLink>
            <FooterLink to="/collection" search={{ sale: "true" }}>
              {footer.shopSale}
            </FooterLink>
            <FooterLink to="/account" search={{ tab: "wishlist" }}>
              {footer.shopWishlist}
            </FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title={footer.careTitle}>
            <FooterLink to="/contact">{footer.contactUs}</FooterLink>
            <FooterLink to="/sizing">{footer.sizeGuide}</FooterLink>
            <FooterLink to="/care">{footer.careGuide}</FooterLink>
            <FooterLink to="/faq">{footer.faq}</FooterLink>
            <FooterLink to="/shipping">{footer.shipping}</FooterLink>
            <FooterLink to="/returns">{footer.returns}</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title={footer.exploreTitle}>
            <FooterLink to="/about">{footer.theBrand}</FooterLink>
            <FooterLink to="/travel-diaries">{footer.travelGuide}</FooterLink>
          </FooterColumn>
        </div>

        <div className="md:col-span-3 lg:col-span-2">
          <FooterColumn title={footer.privacyTitle}>
            <div>
              <CookiePreferencesLink />
            </div>
            <FooterLink to="/terms">{footer.terms}</FooterLink>
            <FooterLink to="/about" hash="artisans">
              {footer.artisans}
            </FooterLink>
            <FooterLink to="/about" hash="quality">
              {footer.materials}
            </FooterLink>
          </FooterColumn>
        </div>
      </div>

      <div className="page-wrap section-pad py-8 border-t border-surface/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-eyebrow !text-surface/60">{footer.copyright}</p>
        <SocialIconLinks iconClassName="size-4" className="[&_a]:!text-surface/80 [&_a:hover]:!text-surface" />
      </div>
    </footer>
  );
}
