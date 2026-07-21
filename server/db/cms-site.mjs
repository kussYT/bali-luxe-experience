import { getSetting, getSettings, setSetting } from "./settings-store.mjs";
import { invalidateCache } from "./request-cache.mjs";
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_HOMEPAGE,
  mergeAnnouncement,
  mergeHomepage,
  mergeAbout,
  mergeFindUs,
  mergeContact,
  mergeCare,
  mergeSizing,
  mergeFooter,
  mergeProductMessages,
  resolveProductMessages,
  resolveNavigation,
  navigationStoredForAdmin,
} from "../content-defaults.mjs";

export async function getAnnouncement() {
  const stored = await getSetting("announcement", null);
  return mergeAnnouncement(stored);
}

export async function updateAnnouncement(patch) {
  const current = await getAnnouncement();
  const next = { ...current, ...patch };
  await setSetting("announcement", next);
  return next;
}

export async function getHomepageContent() {
  const stored = await getSetting("homepage", null);
  return mergeHomepage(stored);
}

export async function updateHomepageContent(patch) {
  const stored = (await getSetting("homepage", null)) || {};
  await setSetting("homepage", { ...stored, ...patch });
  return getHomepageContent();
}

export async function getAboutContent() {
  const stored = await getSetting("about", null);
  return mergeAbout(stored);
}

export async function getFindUsContent() {
  const stored = await getSetting("findUs", null);
  return mergeFindUs(stored);
}

export async function getContactContent() {
  const stored = await getSetting("contact", null);
  return mergeContact(stored);
}

export async function getCareContent() {
  const stored = await getSetting("care", null);
  return mergeCare(stored);
}

export async function getSizingContent() {
  const stored = await getSetting("sizing", null);
  return mergeSizing(stored);
}

export async function getFooterContent() {
  const stored = await getSetting("footer", null);
  return mergeFooter(stored);
}

export async function getProductMessagesContent(locale) {
  const stored = await getSetting("productMessages", null);
  if (locale) return resolveProductMessages(stored, locale);
  return mergeProductMessages(stored);
}

export async function getPublicSiteContent({ locale } = {}) {
  const stored = await getSettings([
    "announcement",
    "homepage",
    "about",
    "findUs",
    "contact",
    "care",
    "sizing",
    "footer",
    "productMessages",
  ]);
  return {
    announcement: mergeAnnouncement(stored.announcement),
    homepage: (() => {
      const homepage = mergeHomepage(stored.homepage);
      return {
        ...homepage,
        navigation: resolveNavigation(homepage.navigation, locale),
      };
    })(),
    about: mergeAbout(stored.about),
    findUs: mergeFindUs(stored.findUs),
    contact: mergeContact(stored.contact),
    care: mergeCare(stored.care),
    sizing: mergeSizing(stored.sizing),
    footer: mergeFooter(stored.footer),
    productMessages: resolveProductMessages(stored.productMessages, locale),
    defaults: { homepage: DEFAULT_HOMEPAGE },
  };
}

export async function getAdminSiteContent() {
  const stored = await getSettings([
    "homepage",
    "announcement",
    "about",
    "findUs",
    "contact",
    "care",
    "sizing",
    "footer",
    "productMessages",
  ]);
  const storedHomepage = stored.homepage || {};
  const storedAnnouncement = stored.announcement || {};
  const storedAbout = stored.about || {};
  const storedFindUs = stored.findUs || {};
  const storedContact = stored.contact || {};
  const storedCare = stored.care || {};
  const storedSizing = stored.sizing || {};
  const storedFooter = stored.footer || {};
  const storedProductMessages = stored.productMessages || {};
  const homepageMerged = mergeHomepage(storedHomepage);
  const navigationStored = navigationStoredForAdmin(storedHomepage?.navigation);
  return {
    announcement: mergeAnnouncement(storedAnnouncement),
    homepage: {
      ...homepageMerged,
      navigation: resolveNavigation(storedHomepage?.navigation, "en"),
      navigationStored: { locales: navigationStored.locales },
    },
    about: mergeAbout(storedAbout),
    findUs: mergeFindUs(storedFindUs),
    contact: mergeContact(storedContact),
    care: mergeCare(storedCare),
    sizing: mergeSizing(storedSizing),
    footer: mergeFooter(storedFooter),
    productMessages: mergeProductMessages(storedProductMessages),
    stored: {
      announcement: storedAnnouncement,
      homepage: storedHomepage,
      about: storedAbout,
      findUs: storedFindUs,
      contact: storedContact,
      care: storedCare,
      sizing: storedSizing,
      footer: storedFooter,
      productMessages: storedProductMessages,
    },
  };
}

export async function patchAdminSiteContent(body) {
  if (body.announcement) {
    await setSetting("announcement", { ...(await getSetting("announcement", {})), ...body.announcement });
  }
  if (body.homepage) {
    await setSetting("homepage", { ...(await getSetting("homepage", {})), ...body.homepage });
    invalidateCache("site-content:");
  }
  if (body.about) {
    await setSetting("about", body.about);
  }
  if (body.findUs) {
    await setSetting("findUs", body.findUs);
  }
  if (body.contact) {
    await setSetting("contact", body.contact);
  }
  if (body.care) {
    await setSetting("care", body.care);
  }
  if (body.sizing) {
    await setSetting("sizing", body.sizing);
  }
  if (body.footer) {
    await setSetting("footer", body.footer);
  }
  if (body.productMessages) {
    const payload =
      body.productMessages.locales && typeof body.productMessages.locales === "object"
        ? body.productMessages
        : { locales: body.productMessages };
    await setSetting("productMessages", payload);
  }
  return getAdminSiteContent();
}
