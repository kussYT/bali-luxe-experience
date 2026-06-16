import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.05, rootMargin: "0px 0px -5% 0px", once: true });

  return (
    <div
      ref={ref}
      className={`reveal-on-scroll ${inView ? "is-visible" : "reveal-pending"} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}
