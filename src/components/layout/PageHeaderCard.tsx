import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function PageHeaderCard(props: {
  children: ReactNode;
  className?: string;
}) {
  const { children, className } = props;

  return (
    <div className={cn("rounded-2xl border bg-card/70 shadow-sm", className)}>
      {children}
    </div>
  );
}
