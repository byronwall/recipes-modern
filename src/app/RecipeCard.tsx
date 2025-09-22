"use client";

import React from "react";
import Link from "next/link";
import { Card, CardTitle } from "~/components/ui/card";
import { ImageRole, type Recipe } from "@prisma/client";
import { RecipeActions } from "./recipes/[id]/RecipeActions";
import ImageLightbox from "~/components/ImageLightbox";

type RecipeWithImages = Recipe & {
  images?:
    | {
        role: ImageRole;
        order: number;
        image: { key: string; bucket: string; alt: string | null };
      }[]
    | undefined;
};

export function RecipeCard({ recipe }: { recipe: RecipeWithImages }) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [lightboxImages, setLightboxImages] = React.useState<
    { url: string; alt?: string | null; caption?: string | null }[]
  >([]);

  return (
    <Card key={recipe.name} className="min-h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
      </CardTitle>
      <div className="flex items-center gap-2 p-2">
        {(() => {
          const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

          const primaryImage =
            (recipe.images ?? []).find((ri) => ri.role === ImageRole.HERO) ??
            (recipe.images ?? [])[0];
          if (!primaryImage) return null;
          const url = `${base}/${primaryImage.image.key}`;
          return (
            <button
              type="button"
              aria-label="Open image"
              onClick={() => {
                const imgs = (recipe.images ?? []).map((ri) => ({
                  url: `${base}/${ri.image.key}`,
                  alt: ri.image.alt ?? "",
                }));
                const idx = Math.max(
                  0,
                  Math.min(
                    imgs.findIndex((x) => x.url === url),
                    Math.max(0, imgs.length - 1),
                  ),
                );
                setLightboxImages(imgs);
                setLightboxIndex(idx < 0 ? 0 : idx);
                setLightboxOpen(true);
              }}
              className="h-12 w-12"
            >
              <img
                src={url}
                alt={primaryImage.image.alt ?? ""}
                className="h-12 w-12 rounded object-cover ring-1 ring-muted"
              />
            </button>
          );
        })()}
        <RecipeActions recipeId={recipe.id} />
      </div>
      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={lightboxImages}
        initialIndex={lightboxIndex}
      />
    </Card>
  );
}
