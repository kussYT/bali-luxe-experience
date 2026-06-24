import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";

import appCss from "../styles.css?url";

import { LocaleProvider } from "@/lib/i18n/locale-context";
import { AccountProvider } from "@/lib/account-context";
import { CurrencyProvider } from "@/lib/currency";

import { CartProvider } from "@/lib/cart";

import { CatalogProvider } from "@/lib/catalog-context";

import { ContentProvider } from "@/lib/content-context";

import { CookieConsentProvider } from "@/lib/cookie-consent-context";

import { Header } from "@/components/site/Header";

import { Footer } from "@/components/site/Footer";

import { Marquee } from "@/components/site/Marquee";

import { CartDrawer } from "@/components/site/CartDrawer";

import { SitePreferencesDock } from "@/components/site/SitePreferencesDock";

import { BinginSounds } from "@/components/lifestyle/BinginSounds";

import { CookieConsent } from "@/components/site/CookieConsent";

import { Toaster } from "@/components/ui/sonner";



function NotFoundComponent() {

  return (

    <div className="flex min-h-screen items-center justify-center bg-background px-4">

      <div className="max-w-md text-center">

        <h1 className="font-display text-5xl md:text-7xl">404</h1>

        <p className="mt-4 text-muted-foreground">This page drifted out to sea.</p>

        <Link to="/" className="mt-8 inline-block btn-primary">

          Return home

        </Link>

      </div>

    </div>

  );

}



export const Route = createRootRoute({

  head: () => ({

    meta: [

      { charSet: "utf-8" },

      { name: "viewport", content: "width=device-width, initial-scale=1" },

      { title: "Bingin Diaries — Hats from Bali & France" },

      {

        name: "description",

        content: "Hand-woven hats crafted between Bali and France. A boutique house of slow, sun-soaked design.",

      },

      { property: "og:title", content: "Bingin Diaries" },

      { property: "og:description", content: "Hand-woven hats from Bali & France." },

      { property: "og:type", content: "website" },

      { name: "twitter:card", content: "summary_large_image" },

      { property: "og:image", content: "/logo.png" },

    ],

    links: [

      { rel: "stylesheet", href: appCss },

      { rel: "icon", href: "/favicon.png", type: "image/png" },

      { rel: "apple-touch-icon", href: "/logo-mark.png" },

      { rel: "preconnect", href: "https://fonts.googleapis.com" },

      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },

      {

        rel: "stylesheet",

        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap",

      },

    ],

  }),

  shellComponent: RootShell,

  component: RootComponent,

  notFoundComponent: NotFoundComponent,

});



function RootShell({ children }: { children: React.ReactNode }) {

  return (

    <html lang="en">

      <head>

        <HeadContent />

      </head>

      <body>

        {children}

        <Scripts />

      </body>

    </html>

  );

}



function RootComponent() {

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isAdmin = pathname.startsWith("/admin");



  return (

    <CatalogProvider>

      <ContentProvider>

      <LocaleProvider>

      <AccountProvider>

      <CurrencyProvider>

        <CartProvider>

          <CookieConsentProvider>

              {!isAdmin && <Marquee />}

              {!isAdmin && <Header />}

              <main>

                <Outlet />

              </main>

              {!isAdmin && <BinginSounds />}

              {!isAdmin && <Footer />}

              {!isAdmin && <CartDrawer />}

              {!isAdmin && <SitePreferencesDock />}

              {!isAdmin && <CookieConsent />}

              <Toaster position="top-center" />

          </CookieConsentProvider>

        </CartProvider>

      </CurrencyProvider>

      </AccountProvider>

      </LocaleProvider>

      </ContentProvider>

    </CatalogProvider>

  );

}


