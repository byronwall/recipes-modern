"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import ImageLightbox from "~/components/ImageLightbox";
import SimpleAlertDialog from "~/components/SimpleAlertDialog";
import { getImageUrl } from "~/lib/media";
import { api } from "~/trpc/react";
import { type Recipe } from "./recipe-types";

export function RecipeImagesSection(props: { recipe: Recipe }) {
  const { recipe } = props;
  const utils = api.useUtils();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getUploadUrl = api.images.getUploadUrl.useMutation();
  const confirmUpload = api.images.confirmUpload.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });
  const deleteImageMutation = api.images.deleteRecipeImage.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id: recipe.id });
    },
  });

  async function uploadSingleFile(file: File) {
    const { key, url } = await getUploadUrl.mutateAsync({
      recipeId: recipe.id,
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

    await confirmUpload.mutateAsync({
      recipeId: recipe.id,
      role: "GALLERY",
      key,
    });
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

  return (
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
    </section>
  );
}
