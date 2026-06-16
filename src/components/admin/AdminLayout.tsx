import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { adminLogout, checkAdminSession } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/newsletter", label: "Newsletter" },
] as const;

function AdminNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-2 text-sm">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          className={`py-2 px-2 rounded-sm transition ${pathname === link.to || (!link.exact && pathname.startsWith(link.to + "/")) ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
        >
          {link.label}
        </Link>
      ))}
      <Link
        to="/"
        onClick={onNavigate}
        className="py-2 px-2 text-muted-foreground hover:text-ink transition"
      >
        View site
      </Link>
    </nav>
  );
}

export function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(isLogin);
  const [authed, setAuthed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    checkAdminSession()
      .then((res) => {
        if (!res.authenticated) {
          navigate({ to: "/admin/login" });
          return;
        }
        setAuthed(true);
      })
      .catch(() => navigate({ to: "/admin/login" }))
      .finally(() => setReady(true));
  }, [isLogin, navigate, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading admin…</p>
      </div>
    );
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  if (!authed) return null;

  const logout = async () => {
    await adminLogout();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="flex items-center justify-center size-9"
          aria-label="Open admin menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="text-center min-w-0">
          <p className="text-eyebrow text-muted-foreground text-[0.6rem]">Bingin Diaries</p>
          <p className="font-display text-lg leading-none">Admin</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Log out
        </Button>
      </header>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <aside className="w-full max-w-xs bg-background flex flex-col h-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-display text-xl">Admin</p>
              <button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-8 flex-1 overflow-y-auto">
              <AdminNav pathname={pathname} onNavigate={() => setNavOpen(false)} />
              <Button variant="outline" className="mt-auto" onClick={logout}>
                Log out
              </Button>
            </div>
          </aside>
          <div className="flex-1 bg-ink/40 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border p-6 flex-col gap-8 shrink-0">
        <div>
          <p className="text-eyebrow text-muted-foreground">Bingin Diaries</p>
          <h1 className="font-display text-2xl mt-1">Admin</h1>
        </div>
        <AdminNav pathname={pathname} />
        <Button variant="outline" className="mt-auto" onClick={logout}>
          Log out
        </Button>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
