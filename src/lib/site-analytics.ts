const VISITOR_KEY = "bingin-vid";

function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `anon_${Date.now().toString(36)}`;
  }
}

function readUtmSource(search: string): string {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return (params.get("utm_source") || "").trim();
  } catch {
    return "";
  }
}

let lastSent: { path: string; at: number } | null = null;

/** Record a pageview on our server (works inside Instagram in-app browser). */
export function trackSitePageview(pathname: string, search = "") {
  if (typeof window === "undefined") return;
  const path = (pathname || "/").split("?")[0] || "/";
  if (path.startsWith("/admin") || path.startsWith("/api")) return;

  const now = Date.now();
  if (lastSent && lastSent.path === path && now - lastSent.at < 1500) return;
  lastSent = { path, at: now };

  const visitorId = getOrCreateVisitorId();
  const referrer = document.referrer || "";
  const utmSource = readUtmSource(search || window.location.search);

  fetch("/api/analytics/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitorId, path, referrer, utmSource }),
    keepalive: true,
  }).catch(() => {});
}
