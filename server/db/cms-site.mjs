import { getSetting, setSetting } from "./settings-store.mjs";
import {
  DEFAULT_ANNOUNCEMENT,
  mergeAnnouncement,
  mergeHomepage,
  DEFAULT_HOMEPAGE,
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

export async function getPublicSiteContent() {
  const [announcement, homepage] = await Promise.all([getAnnouncement(), getHomepageContent()]);
  return { announcement, homepage, defaults: { homepage: DEFAULT_HOMEPAGE } };
}

export async function getAdminSiteContent() {
  const storedHomepage = (await getSetting("homepage", null)) || {};
  const storedAnnouncement = (await getSetting("announcement", null)) || {};
  return {
    announcement: mergeAnnouncement(storedAnnouncement),
    homepage: mergeHomepage(storedHomepage),
    stored: { announcement: storedAnnouncement, homepage: storedHomepage },
  };
}

export async function patchAdminSiteContent(body) {
  if (body.announcement) await setSetting("announcement", { ...(await getSetting("announcement", {})), ...body.announcement });
  if (body.homepage) await setSetting("homepage", { ...(await getSetting("homepage", {})), ...body.homepage });
  return getAdminSiteContent();
}
