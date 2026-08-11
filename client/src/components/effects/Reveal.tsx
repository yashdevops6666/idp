import type { ReactNode } from "react";
import { useReveal } from "../../lib/useReveal";

// Wraps children in a div that fades/slides in the first time it enters
// the viewport.
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const cls = `reveal ${revealed ? "revealed" : ""} ${className ?? ""}`.trim();

  return (
    <div ref={ref} className={cls} style={{ transitionDelay: `${delayMs}ms` }}>
      {children}
    </div>
  );
}
