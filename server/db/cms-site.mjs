import { getSetting, getSettings, setSetting } from "./settings-store.mjs";
import { invalidateCache } from "./request-cache.mjs";
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_HOMEPAGE,
  mergeAnnouncement,
  mergeHomepage,
  mergeFindUs,
  mergeContact,
  mergeCare,
  mergeFooter,
  mergeProductMessages,
  resolveProductMessages,
  resolveNavigation,
  resolveAbout,
  resolveSizing,
  normalizeAboutStored,
  normalizeSizingStored,
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

export async function getAboutContent(locale = "fr") {
  const stored = await getSetting("about", null);
  return resolveAbout(stored, locale);
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

export async function getSizingContent(locale = "fr") {
  const stored = await getSetting("sizing", null);
  return resolveSizing(stored, locale);
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
    about: resolveAbout(stored.about, locale),
    findUs: mergeFindUs(stored.findUs),
    contact: mergeContact(stored.contact),
    care: mergeCare(stored.care),
    sizing: resolveSizing(stored.sizing, locale),
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
  const storedAbout = normalizeAboutStored(stored.about);
  const storedFindUs = stored.findUs || {};
  const storedContact = stored.contact || {};
  const storedCare = stored.care || {};
  const storedSizing = normalizeSizingStored(stored.sizing);
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
    about: storedAbout,
    findUs: mergeFindUs(storedFindUs),
    contact: mergeContact(storedContact),
    care: mergeCare(storedCare),
    sizing: storedSizing,
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
    await setSetting("about", normalizeAboutStored(body.about));
    invalidateCache("site-content:");
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
    await setSetting("sizing", normalizeSizingStored(body.sizing));
    invalidateCache("site-content:");
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
