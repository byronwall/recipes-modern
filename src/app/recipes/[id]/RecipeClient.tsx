"use client";

import { useRef, useState } from "react";
import { RecipeType } from "@prisma/client";
import { ChevronDown, ImagePlus, Pencil, Plus, Trash } from "lucide-react";
import { H2 } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api, type RouterOutputs } from "~/trpc/react";
import { openAddTagDialog } from "~/hooks/use-add-tag-dialog";
import { IngredientList } from "./IngredientList";
import { RecipeActions } from "./RecipeActions";
import { StepList } from "./StepList";
import { CookingModeOverlay } from "./CookingModeOverlay";
import ImageLightbox from "~/components/ImageLightbox";
import SimpleAlertDialog from "~/components/SimpleAlertDialog";
import { getImageUrl } from "~/lib/media";

export type Recipe = NonNullable<RouterOutputs["recipe"]["getRecipe"]>;

export function RecipeClient(props: { id: number }) {
  const { id } = props;

  const { data: recipe } = api.recipe.getRecipe.useQuery({
    id,
  });

  const utils = api.useUtils();
  const updateMutation = api.recipe.updateRecipeMeta.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
      setOpen(false);
    },
  });
  const setTagsMutation = api.tag.setTagsForRecipe.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
    },
  });
  const upsertTag = api.tag.upsertByName.useMutation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RecipeType | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [cookMinutes, setCookMinutes] = useState<number | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getUploadUrl = api.images.getUploadUrl.useMutation();
  const confirmUpload = api.images.confirmUpload.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
    },
  });
  const deleteImageMutation = api.images.deleteRecipeImage.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
    },
  });

  async function uploadSingleFile(file: File) {
    const { key, url } = await getUploadUrl.mutateAsync({
      recipeId: id,
      role: "GALLERY",
      mime: file.type,
      ext: file.name.match(/\.[^./]+$/)?.[0],
    });

    const put = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) throw new Error("Upload failed");

    await confirmUpload.mutateAsync({ recipeId: id, role: "GALLERY", key });
  }

  async function handleFilesSelected(files: FileList | File[]) {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setIsUploading(true);
    try {
      for (const f of list) {
        // Upload sequentially to keep API simple
        // eslint-disable-next-line no-await-in-loop
        await uploadSingleFile(f);
      }
    } finally {
      setIsUploading(false);
    }
  }

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <div className="relative w-full space-y-6">
      <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <H2 className="flex items-center gap-2 border-b-0 pb-0">
                <span>{recipe.name}</span>
              </H2>
              <Dialog
                open={open}
                onOpenChange={(val) => {
                  setOpen(val);
                  if (val) {
                    setName(recipe.name ?? "");
                    setDescription(recipe.description ?? "");
                    setType(recipe.type);
                    setCookMinutes(
                      typeof recipe.cookMinutes === "number"
                        ? recipe.cookMinutes
                        : undefined,
                    );
                    setTags(
                      (recipe.tags ?? []).map((rt) => rt.tag.name).filter(Boolean),
                    );
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Edit recipe">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Edit recipe</DialogTitle>
                    <DialogDescription>Update recipe details.</DialogDescription>
                  </DialogHeader>

                  <form
                    className="grid gap-6"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await updateMutation.mutateAsync({
                        id,
                        name: name.trim(),
                        description: description ?? "",
                        type,
                        cookMinutes,
                      });
                      // ensure tag slugs
                      const tagNames = tags.map((t) => t.trim()).filter(Boolean);
                      for (const name of tagNames) {
                        await upsertTag.mutateAsync({ name });
                      }
                      const slugs = tagNames.map((n) =>
                        n.toLowerCase().replace(/\s+/g, "-"),
                      );
                      await setTagsMutation.mutateAsync({
                        recipeId: id,
                        tagSlugs: slugs,
                      });
                    }}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="recipe-name">Name</Label>
                        <Input
                          id="recipe-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          autoFocus
                          className="h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="recipe-description">Description</Label>
                        <Textarea
                          id="recipe-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          autoResize
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type</Label>
                        <RadioGroup
                          className="flex flex-wrap gap-2"
                          value={type}
                          onValueChange={(v) => setType(v as RecipeType)}
                        >
                          {Object.values(RecipeType).map((t) => {
                            const selected = type === t;
                            return (
                              <label
                                key={t}
                                htmlFor={`edit-type-${t}`}
                                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize transition ${
                                  selected
                                    ? "bg-muted"
                                    : "bg-background hover:bg-muted/60"
                                }`}
                              >
                                <RadioGroupItem
                                  value={t}
                                  id={`edit-type-${t}`}
                                  className="sr-only"
                                />
                                <span>{t.toLowerCase()}</span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recipe-cook-minutes">
                          Cooking time (minutes)
                        </Label>
                        <Input
                          id="recipe-cook-minutes"
                          type="number"
                          min={0}
                          placeholder="e.g. 30"
                          value={cookMinutes ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCookMinutes(val ? Number(val) : undefined);
                          }}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Tags</Label>
                        <InlineTagEditor
                          recipeId={id}
                          values={tags}
                          onChange={setTags}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={updateMutation.isPending}>
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {recipe.description &&
            recipe.description.trim().toLowerCase() !== "desc" ? (
              <p className="max-w-prose text-muted-foreground">
                {recipe.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {recipe.type}
              </span>
              {typeof recipe.cookMinutes === "number" && (
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {recipe.cookMinutes} min
                </span>
              )}
              {(recipe.tags ?? []).length > 0 ? (
                (recipe.tags ?? []).map((rt) => (
                  <span
                    key={rt.tag.id}
                    className="rounded-full bg-muted px-3 py-1 text-xs"
                  >
                    {rt.tag.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
          </div>

          <div className="w-full max-w-xs border-l border-muted/60 pl-6 lg:ml-auto lg:self-start">
            <div className="text-xs uppercase text-muted-foreground">
              Actions
            </div>
            <div className="mt-3">
              <RecipeActions recipeId={recipe.id} variant="full" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <IngredientList recipe={recipe} />
        </section>
        <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
          <StepList recipe={recipe} />
        </section>
      </div>

      <CookingModeOverlay recipe={recipe} />

      <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <Label>Images</Label>
        <div
          className={`group relative flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed p-4 transition-colors ${
            isDragOver ? "border-primary bg-primary/5" : "border-muted"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.length) {
              void handleFilesSelected(e.dataTransfer.files);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Drag & drop images</div>
              <div className="text-xs text-muted-foreground">
                or click to choose files
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" isLoading={isUploading}>
            {isUploading ? "Uploading..." : "Choose files"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void handleFilesSelected(e.target.files);
                // reset input so same file can be selected again
                e.currentTarget.value = "";
              }
            }}
          />
        </div>

        {recipe.images?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {recipe.images.map((ri, idx) => {
              const url = getImageUrl({
                bucket: ri.image.bucket,
                key: ri.image.key,
              });
              return (
                <div
                  key={ri.imageId}
                  className="group relative overflow-hidden rounded-lg ring-1 ring-muted"
                >
                  <button
                    type="button"
                    className="aspect-[4/3] w-full overflow-hidden"
                    onClick={() => {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    aria-label="Open image"
                  >
                    <img
                      src={url}
                      alt={ri.image.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                  <SimpleAlertDialog
                    trigger={
                      <button
                        type="button"
                        className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white opacity-90 shadow hover:opacity-100 focus:outline-none"
                        aria-label="Delete image"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    }
                    title="Delete this image?"
                    description="This will remove the image from this recipe."
                    confirmText="Delete"
                    onConfirm={async () => {
                      await deleteImageMutation.mutateAsync({
                        recipeImageId: ri.id,
                      });
                    }}
                  />
                  {ri.caption ? (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      {ri.caption}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No images yet</div>
        )}
      </section>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
        images={(recipe.images ?? []).map((ri) => ({
          url: getImageUrl({ bucket: ri.image.bucket, key: ri.image.key }),
          alt: ri.image.alt ?? "",
          caption: ri.caption ?? undefined,
        }))}
      />
    </div>
  );
}

  function InlineTagEditor(props: {
    values: string[];
    onChange: (vals: string[]) => void;
    recipeId?: number;
  }) {
  const { values, onChange, recipeId } = props;
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data } = api.tag.search.useQuery({ q: input, limit: 10 });
  const lowerValues = values.map((v) => v.toLowerCase());
  const filteredSuggestions =
    data?.filter((t) => !lowerValues.includes(t.name.toLowerCase())) ?? [];
  // global add tag dialog used instead of local dialog
  const utils = api.useUtils();
  const upsertTag = api.tag.upsertByName.useMutation();
  const setTagsMutation = api.tag.setTagsForRecipe.useMutation({
    onSuccess: async () => {
      if (recipeId) {
        await utils.recipe.getRecipe.invalidate({ id: recipeId });
      }
    },
  });

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = values.some(
      (v) => v.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(values.filter((v) => v !== name));
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
          >
            {v}
            <button
              className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              onClick={() => removeTag(v)}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add or search tags"
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Add tag">
              <ChevronDown className="h-4 w-4" />
              Add tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            <div className="max-h-56 overflow-auto">
              {filteredSuggestions.length ? (
                filteredSuggestions.map((t) => (
                  <button
                    key={t.id}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => addTag(t.name)}
                  >
                    {t.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No tags
                </div>
              )}
              {input.trim() && (
                <button
                  className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => addTag(input)}
                >
                  Create “{input}”
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
