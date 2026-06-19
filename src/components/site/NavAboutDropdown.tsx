import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { NAV_ABOUT_COLUMNS, NAV_ABOUT_FEATURED } from "@/lib/navigation";

const triggerClass =
  "text-[0.6875rem] font-medium tracking-[0.22em] uppercase py-2 link-underline text-foreground/80 hover:text-foreground transition-colors duration-[450ms]";

export function NavAboutDropdown({ onNavigate }: { onNavigate?: () => void }) {
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
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        About us
      </button>

      {open && (
        <div
          id={menuId}
          className="fixed left-0 right-0 top-[4.25rem] md:top-[5.25rem] z-50 border-b border-border bg-secondary/90 backdrop-blur-sm animate-fade-in shadow-[0_24px_48px_-20px_rgba(28,26,23,0.12)]"
        >
          <div className="page-wrap section-pad py-10 md:py-12 lg:py-14">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-14 xl:gap-20 items-start">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 lg:gap-14 xl:gap-16">
                {NAV_ABOUT_COLUMNS.map((column) => (
                  <div key={column.title}>
                    <p className="text-eyebrow text-foreground/45 mb-4 md:mb-5">{column.title}</p>
                    <ul className="space-y-2.5 md:space-y-3">
                      {column.items.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={item.to}
                            search={item.search as never}
                            hash={item.hash}
                            onClick={close}
                            className="text-sm md:text-[0.9375rem] leading-snug text-foreground/85 hover:text-foreground transition-colors duration-300"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-3 xl:gap-4 w-[min(100%,26rem)] xl:w-[28rem] shrink-0">
                {NAV_ABOUT_FEATURED.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    hash={item.hash}
                    onClick={close}
                    className="group block"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-white border border-border/60">
                      <img
                        src={item.image}
                        alt=""
                        className="size-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-eyebrow mt-2.5 text-foreground/70 group-hover:text-foreground transition-colors">
                      {item.label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
