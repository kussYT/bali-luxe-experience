import { useId } from "react";

const triggerClass =
  "text-[0.6875rem] font-medium tracking-[0.22em] uppercase py-2 link-underline text-foreground/80 hover:text-foreground transition-colors duration-[450ms]";

type NavMegaTriggerProps = {
  label: string;
  open: boolean;
  onOpen: () => void;
  onToggle: () => void;
};

export function NavMegaTrigger({ label, open, onOpen, onToggle }: NavMegaTriggerProps) {
  const menuId = useId();

  return (
    <div onMouseEnter={onOpen}>
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? menuId : undefined}
        onClick={onToggle}
      >
        {label}
      </button>
    </div>
  );
}
