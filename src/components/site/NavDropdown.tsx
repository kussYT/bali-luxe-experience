import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import type { NavLink } from "@/lib/navigation";

type NavDropdownProps = {
  label: string;
  items: NavLink[];
  onNavigate?: () => void;
  className?: string;
};

export function NavDropdown({ label, items, onNavigate, className = "" }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="text-sm py-2 link-underline"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50 min-w-[13rem]">
          <ul
            id={menuId}
            role="menu"
            className="bg-popover border border-border shadow-xl py-2 animate-fade-in"
          >
            {items.map((item) => (
              <li key={`${item.label}-${item.to}`} role="none">
                <Link
                  to={item.to}
                  search={item.search as never}
                  hash={item.hash}
                  role="menuitem"
                  onClick={close}
                  className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
