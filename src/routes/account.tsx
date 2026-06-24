import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useCatalog } from "@/lib/catalog-context";
import { useAccount } from "@/lib/account-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { ProductCard } from "@/components/site/ProductCard";

type AccountSearch = { tab?: "login" | "wishlist" | "orders"; verify?: string; share?: string };

function formatOrderTotal(amount: number | null, currency: string) {
  if (amount == null) return "—";
  const value = amount / 100;
  if (currency === "USD") return `$${value.toFixed(2)}`;
  if (currency === "IDR") return `Rp ${Number(amount).toLocaleString("en-US")}`;
  return `€${value.toFixed(2)}`;
}

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => {
    const tab = search.tab;
    const verify = typeof search.verify === "string" ? search.verify : undefined;
    const share = typeof search.share === "string" ? search.share : undefined;
    if (tab === "wishlist" || tab === "orders" || tab === "login") return { tab, verify, share };
    return { tab: verify ? "login" : "login", verify, share };
  },
  head: () => ({ meta: [{ title: "Account — Bingin Diaries" }] }),
  component: Account,
});

function Account() {
  const { tab: tabFromUrl, verify } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "wishlist" | "orders">(tabFromUrl ?? "login");
  const [emailInput, setEmailInput] = useState("");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { wishlist: localWishlist } = useCart();
  const { publishedProducts } = useCatalog();
  const { email, wishlist: accountWishlist, orders, loading, requestLink, verify: verifyAccount, logout, syncWishlist } =
    useAccount();
  const { t } = useLocale();

  const activeWishlist = email ? accountWishlist : localWishlist;
  const wished = publishedProducts.filter((p) => activeWishlist.includes(p.slug));

  useEffect(() => {
    if (tabFromUrl) setTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (!verify) return;
    verifyAccount(verify)
      .then(() => toast.success(t("account.linkSent")))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Invalid link"));
  }, [verify, verifyAccount, t]);

  async function handleRequestLink(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setDevLink(null);
    try {
      const res = await requestLink(emailInput);
      toast.success(t("account.linkSent"));
      if (res.devLink) setDevLink(res.devLink);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleShareWishlist() {
    if (!activeWishlist.length) return;
    try {
      const res = await fetch("/api/wishlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs: activeWishlist }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Share failed");
      await navigator.clipboard.writeText(data.url);
      toast.success(t("account.linkCopied"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Share failed");
    }
  }

  return (
    <section className="page-wrap section-pad mx-auto py-16 md:py-20 max-w-6xl bg-white">
      <p className="text-eyebrow text-muted-foreground">{t("account.eyebrow")}</p>
      <h1 className="font-display text-5xl md:text-7xl mt-4 leading-[0.95]">{t("account.title")}</h1>

      {email && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("account.signedInAs")} {email}{" "}
          <button type="button" onClick={() => logout()} className="link-underline ml-2">
            {t("account.signOut")}
          </button>
        </p>
      )}

      <div className="flex gap-4 sm:gap-8 mt-12 border-b border-border overflow-x-auto">
        {(["login", "wishlist", "orders"] as const).map((item) => (
          <Link
            key={item}
            to="/account"
            search={{ tab: item }}
            className={`pb-4 text-eyebrow whitespace-nowrap shrink-0 ${tab === item ? "text-ink border-b border-ink -mb-px" : "text-muted-foreground"}`}
          >
            {t(`account.${item}`)}
          </Link>
        ))}
      </div>

      <div className="mt-12">
        {tab === "login" && !email && (
          <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
            <form className="space-y-5" onSubmit={handleRequestLink}>
              <h2 className="font-display text-2xl">{t("account.login")}</h2>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t("account.email")}
                required
                className="w-full bg-transparent border-b border-border py-3 outline-none focus:border-ink"
              />
              <button className="bg-ink text-bone px-8 py-3.5 text-eyebrow w-full disabled:opacity-50" disabled={submitting}>
                {submitting ? "…" : t("account.sendLink")}
              </button>
              {devLink && (
                <p className="text-xs text-muted-foreground break-all">
                  {t("account.devLink")}:{" "}
                  <a href={devLink} className="link-underline">
                    {devLink}
                  </a>
                </p>
              )}
            </form>
            <div className="md:border-l md:border-border md:pl-12 pt-8 md:pt-0 border-t md:border-t-0 border-border">
              <h2 className="font-display text-2xl">{t("account.newHere")}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{t("account.newHereBody")}</p>
            </div>
          </div>
        )}

        {tab === "login" && email && (
          <p className="text-muted-foreground">{t("account.linkSent")}</p>
        )}

        {tab === "wishlist" && (
          <>
            {wished.length > 0 && (
              <button type="button" onClick={handleShareWishlist} className="mb-8 text-eyebrow link-underline">
                {t("account.shareWishlist")}
              </button>
            )}
            {wished.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
                {wished.map((p, i) => (
                  <ProductCard key={p.slug} product={p} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-display text-3xl">{t("account.emptyWishlist")}</p>
                <Link to="/collection" className="mt-6 inline-block text-eyebrow link-underline">
                  {t("account.browse")}
                </Link>
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          loading ? (
            <p className="text-muted-foreground">…</p>
          ) : orders.length ? (
            <ul className="divide-y divide-border max-w-2xl">
              {orders.map((order) => (
                <li key={order.id} className="py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                  </div>
                  <p className="text-sm">
                    {formatOrderTotal(order.amountTotal, order.currency)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-20">
              <p className="font-display text-3xl">{t("account.noOrders")}</p>
              <p className="text-muted-foreground mt-3">{t("account.noOrdersBody")}</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
