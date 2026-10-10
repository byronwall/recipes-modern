"use client";

import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TooltipButton } from "~/components/ui/tooltip-button";

/** Subtle read-mode header for the ingredients / instructions cards. */
export function SectionHeading(props: {
  title: string;
  count?: number;
  onEdit: () => void;
}) {
  const { title, count, onEdit } = props;

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        {count ? (
          <span className="ml-1.5 font-normal normal-case tracking-normal">
            · {count}
          </span>
        ) : null}
      </h3>
      <TooltipButton content="Edit ingredients & instructions">
        <Button
          aria-label="Edit ingredients and instructions"
          onClick={onEdit}
          variant="ghost"
          size="icon-sm"
          className="-my-1 -mr-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <Pencil className="h-4 w-4 shrink-0" />
        </Button>
      </TooltipButton>
    </div>
  );
}

export function EmptySectionState(props: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const { message, actionLabel, onAction } = props;

  return (
    <div className="flex flex-col items-start gap-2 rounded-xl bg-muted/50 px-4 py-5 text-sm text-muted-foreground">
      <p>{message}</p>
      <Button size="sm" variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
