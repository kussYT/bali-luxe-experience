import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminLogout, checkAdminSession } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/inventory", label: "Inventory" },
] as const;

export function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(isLogin);
  const [authed, setAuthed] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 border-r border-border p-6 flex flex-col gap-8 shrink-0">
        <div>
          <p className="text-eyebrow text-muted-foreground">Bingin Diaries</p>
          <h1 className="font-display text-2xl mt-1">Admin</h1>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`py-2 px-2 rounded-sm transition ${pathname === link.to || (!link.exact && pathname.startsWith(link.to + "/")) ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/" className="py-2 px-2 text-muted-foreground hover:text-ink transition">
            View site
          </Link>
        </nav>
        <Button
          variant="outline"
          className="mt-auto"
          onClick={async () => {
            await adminLogout();
            navigate({ to: "/admin/login" });
          }}
        >
          Log out
        </Button>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
