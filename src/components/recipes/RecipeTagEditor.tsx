"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { openAddTagDialog } from "~/hooks/use-add-tag-dialog";
import SimpleAlertDialog from "~/components/SimpleAlertDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type TagItem = {
  id: number | string;
  name: string;
  slug: string;
};

type TagOption = {
  name: string;
  slug: string;
};

export function RecipeTagEditor(props: {
  recipeId: number;
  tags: TagItem[];
  allTags: TagOption[];
  onAddTag: (slug: string) => Promise<void> | void;
  onRemoveTag: (slug: string) => Promise<void> | void;
  displayLimit?: number;
  chipClassName?: string;
  confirmRemove?: boolean;
}) {
  const {
    recipeId,
    tags,
    allTags,
    onAddTag,
    onRemoveTag,
    displayLimit,
    chipClassName,
    confirmRemove = false,
  } = props;
  const [selectValue, setSelectValue] = useState("");
  const visibleTags =
    typeof displayLimit === "number" ? tags.slice(0, displayLimit) : tags;
  const hiddenTags =
    typeof displayLimit === "number" ? tags.slice(displayLimit) : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className={`flex items-center gap-1 rounded-full px-3 py-0.5 text-xs ${chipClassName ?? "bg-accent/60"}`}
        >
          {tag.name}
          {confirmRemove ? (
            <SimpleAlertDialog
              title="Remove tag?"
              description={`Remove “${tag.name}” from this recipe?`}
              confirmText="Remove"
              trigger={
                <button
                  aria-label={`Remove ${tag.name}`}
                  className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
                >
                  ×
                </button>
              }
              onConfirm={async () => {
                await onRemoveTag(tag.slug);
              }}
            />
          ) : (
            <button
              aria-label={`Remove ${tag.name}`}
              className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              onClick={async () => {
                await onRemoveTag(tag.slug);
              }}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {hiddenTags.length > 0 && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                +{hiddenTags.length} more
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {tags.map((t) => t.name).join(", ")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Select
        value={selectValue}
        onValueChange={async (slug) => {
          if (slug === "__new__") {
            openAddTagDialog({
              recipeId,
              existingTagSlugs: tags.map((tag) => tag.slug),
              onSuccess: () => setSelectValue(""),
            });
            return;
          }
          await onAddTag(slug);
          setSelectValue("");
        }}
      >
        <SelectTrigger className="h-7 w-auto rounded-full bg-muted px-3 py-0 text-xs text-muted-foreground hover:bg-muted/80">
          + Tag
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="__new__">Add new tag…</SelectItem>
          {allTags
            .filter((t) => !tags.some((tag) => tag.slug === t.slug))
            .map((t) => (
              <SelectItem key={t.slug} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
