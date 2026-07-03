import { getSetting, setSetting } from "./settings-store.mjs";
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
  const storedProductMessages = await getSetting("productMessages", null);
  const [announcement, homepage, about, findUs, contact, care, sizing, footer] = await Promise.all([
    getAnnouncement(),
    getHomepageContent(),
    getAboutContent(),
    getFindUsContent(),
    getContactContent(),
    getCareContent(),
    getSizingContent(),
    getFooterContent(),
  ]);
  return {
    announcement,
    homepage,
    about,
    findUs,
    contact,
    care,
    sizing,
    footer,
    productMessages: resolveProductMessages(storedProductMessages, locale),
    defaults: { homepage: DEFAULT_HOMEPAGE },
  };
}

export async function getAdminSiteContent() {
  const storedHomepage = (await getSetting("homepage", null)) || {};
  const storedAnnouncement = (await getSetting("announcement", null)) || {};
  const storedAbout = (await getSetting("about", null)) || {};
  const storedFindUs = (await getSetting("findUs", null)) || {};
  const storedContact = (await getSetting("contact", null)) || {};
  const storedCare = (await getSetting("care", null)) || {};
  const storedSizing = (await getSetting("sizing", null)) || {};
  const storedFooter = (await getSetting("footer", null)) || {};
  const storedProductMessages = (await getSetting("productMessages", null)) || {};
  return {
    announcement: mergeAnnouncement(storedAnnouncement),
    homepage: mergeHomepage(storedHomepage),
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
