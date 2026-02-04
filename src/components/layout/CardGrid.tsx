import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function CardGrid(props: { children: ReactNode; className?: string }) {
  const { children, className } = props;

  return <div className={cn("grid gap-4", className)}>{children}</div>;
}
