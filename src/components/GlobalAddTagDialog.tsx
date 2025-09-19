"use client";

import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAddTagDialogStore } from "~/hooks/use-add-tag-dialog";
import { api } from "~/trpc/react";

export function GlobalAddTagDialog() {
  const { isOpen, name, setName, options, close } = useAddTagDialogStore();
  const utils = api.useUtils();
  const upsertTag = api.tag.upsertByName.useMutation();
  const addTagToRecipe = api.tag.addTagToRecipe.useMutation({
    onSuccess: async () => {
      await utils.recipe.list.invalidate();
      if (options?.recipeId) {
        try {
          await utils.recipe.getRecipe.invalidate({ id: options.recipeId });
        } catch {
          // ignore if getRecipe key not present
        }
      }
    },
  });

  const isDuplicate = useMemo(() => {
    const slug = (name ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    return (options?.existingTagSlugs ?? []).includes(slug);
  }, [name, options]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a tag</DialogTitle>
          <DialogDescription>
            Create a new tag
            {options?.recipeId ? " and add it to this recipe" : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="global-new-tag-name">Tag name</Label>
          <Input
            id="global-new-tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vegetarian"
            autoFocus
          />
          {isDuplicate ? (
            <p className="text-xs text-muted-foreground">
              This tag is already added.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const trimmed = (name ?? "").trim();
              if (!trimmed) {
                close();
                return;
              }
              const slug = trimmed.toLowerCase().replace(/\s+/g, "-");
              if ((options?.existingTagSlugs ?? []).includes(slug)) {
                close();
                return;
              }
              await upsertTag.mutateAsync({ name: trimmed });
              if (options?.recipeId) {
                await addTagToRecipe.mutateAsync({
                  recipeId: options.recipeId,
                  tagSlug: slug,
                });
              }
              options?.onSuccess?.({ slug, name: trimmed });
              close();
            }}
            isLoading={upsertTag.isPending || addTagToRecipe.isPending}
          >
            Add tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
