"use client";

import { useRef, useState } from "react";
import { RecipeType } from "@prisma/client";
import { ImagePlus, Pencil, Plus, Trash } from "lucide-react";
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
    <div className="relative w-full space-y-2">
      <H2 className="flex items-center gap-2">
        <span>{recipe.name}</span>
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (val) {
              setName(recipe.name ?? "");
              setDescription(recipe.description ?? "");
              setType(recipe.type);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit recipe</DialogTitle>
              <DialogDescription>Update recipe details.</DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await updateMutation.mutateAsync({
                  id,
                  name: name.trim(),
                  description: description ?? "",
                  type,
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
              <div className="space-y-2">
                <Label htmlFor="recipe-name">Name</Label>
                <Input
                  id="recipe-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
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
                  {Object.values(RecipeType).map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <RadioGroupItem value={t} id={`edit-type-${t}`} />
                      <Label htmlFor={`edit-type-${t}`}>{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <InlineTagEditor
                  recipeId={id}
                  values={tags}
                  onChange={setTags}
                />
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
      </H2>
      {recipe.description &&
      recipe.description.trim().toLowerCase() !== "desc" ? (
        <p className="max-w-prose text-muted-foreground">
          {recipe.description}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <RecipeActions recipeId={recipe.id} />
      </div>

      <IngredientList recipe={recipe} />

      <StepList recipe={recipe} />

      <CookingModeOverlay recipe={recipe} />

      <div className="mt-6 space-y-2">
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
              const base =
                process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
                `https://${
                  process.env.NEXT_PUBLIC_MEDIA_HOST ??
                  "recipes-media.byroni.us"
                }/${process.env.NEXT_PUBLIC_S3_BUCKET ?? "recipes-media"}`;
              const url = `${base}/${ri.image.key}`;
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
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
        images={(recipe.images ?? []).map((ri) => {
          const base =
            process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
            `https://${
              process.env.NEXT_PUBLIC_MEDIA_HOST ?? "recipes-media.byroni.us"
            }/${process.env.NEXT_PUBLIC_S3_BUCKET ?? "recipes-media"}`;
          return {
            url: `${base}/${ri.image.key}`,
            alt: ri.image.alt ?? "",
            caption: ri.caption ?? undefined,
          };
        })}
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
  const { data } = api.tag.search.useQuery({ q: input, limit: 10 });
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
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="rounded bg-muted px-2 py-1 text-xs">
              {v}
              <button
                className="ml-1"
                onClick={() => removeTag(v)}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Add tag"
          onClick={() =>
            openAddTagDialog({
              recipeId,
              existingTagSlugs: values.map((n) =>
                n.toLowerCase().replace(/\s+/g, "-"),
              ),
              onSuccess: ({ name }) => {
                const updated = [...values, name];
                onChange(updated);
                const slugs = updated.map((n) =>
                  n.toLowerCase().replace(/\s+/g, "-"),
                );
                if (recipeId) {
                  setTagsMutation.mutate({ recipeId, tagSlugs: slugs });
                }
              },
            })
          }
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search or create tag"
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <div className="max-h-60 overflow-auto py-1">
            {data?.length ? (
              data.map((t) => (
                <button
                  key={t.id}
                  className="block w-full px-3 py-2 text-left hover:bg-muted"
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
                className="block w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => addTag(input)}
              >
                Create: {input}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
