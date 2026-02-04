import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function ListPanel(props: { children: ReactNode; className?: string }) {
  const { children, className } = props;

  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

export function ListPanelItem(props: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { children, className, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition hover:border-foreground/20 hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ListPanelEmpty(props: {
  children: ReactNode;
  className?: string;
}) {
  const { children, className } = props;

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
