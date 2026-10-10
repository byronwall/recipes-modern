import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Standard page title row: title + optional description on the left,
 * page-level actions on the right. Wraps under the title on narrow screens.
 */
export function PageHeader(props: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const { title, description, actions, className } = props;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
