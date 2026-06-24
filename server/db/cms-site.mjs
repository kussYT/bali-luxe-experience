import { getSetting, setSetting } from "./settings-store.mjs";
import {
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_HOMEPAGE,
  mergeAnnouncement,
  mergeHomepage,
  mergeAbout,
  mergeFindUs,
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

export async function getPublicSiteContent() {
  const [announcement, homepage, about, findUs] = await Promise.all([
    getAnnouncement(),
    getHomepageContent(),
    getAboutContent(),
    getFindUsContent(),
  ]);
  return { announcement, homepage, about, findUs, defaults: { homepage: DEFAULT_HOMEPAGE } };
}

export async function getAdminSiteContent() {
  const storedHomepage = (await getSetting("homepage", null)) || {};
  const storedAnnouncement = (await getSetting("announcement", null)) || {};
  const storedAbout = (await getSetting("about", null)) || {};
  const storedFindUs = (await getSetting("findUs", null)) || {};
  return {
    announcement: mergeAnnouncement(storedAnnouncement),
    homepage: mergeHomepage(storedHomepage),
    about: mergeAbout(storedAbout),
    findUs: mergeFindUs(storedFindUs),
    stored: {
      announcement: storedAnnouncement,
      homepage: storedHomepage,
      about: storedAbout,
      findUs: storedFindUs,
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
  return getAdminSiteContent();
}
