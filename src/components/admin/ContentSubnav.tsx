import { Link, useRouterState } from "@tanstack/react-router";

const LINKS = [
  { to: "/admin/content", label: "Homepage", exact: true },
  { to: "/admin/content/about", label: "About" },
  { to: "/admin/content/find-us", label: "Find us" },
] as const;

export function ContentSubnav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-wrap gap-2 pb-6 border-b border-border mb-8">
      {LINKS.map((link) => {
        const active =
          link.exact ? pathname === link.to : pathname === link.to || pathname.startsWith(`${link.to}/`);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1.5 text-sm rounded-sm transition ${
              active ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
