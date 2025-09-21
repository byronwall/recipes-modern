"use client";

import Link from "next/link";
import { Card, CardTitle } from "~/components/ui/card";
import { ImageRole, type Recipe } from "@prisma/client";
import { RecipeActions } from "./recipes/[id]/RecipeActions";

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
  return (
    <Card key={recipe.name} className="min-h-40">
      <CardTitle className="p-2">
        <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
      </CardTitle>
      <div className="flex items-center gap-2 p-2">
        {(() => {
          const base =
            process.env.NEXT_PUBLIC_MEDIA_BASE_URL ??
            `https://${process.env.NEXT_PUBLIC_MEDIA_HOST ?? "recipes-media.byroni.us"}/${process.env.NEXT_PUBLIC_S3_BUCKET ?? "recipes-media"}`;
          const primaryImage =
            (recipe.images ?? []).find((ri) => ri.role === ImageRole.HERO) ||
            (recipe.images ?? [])[0];
          if (!primaryImage) return null;
          const url = `${base}/${primaryImage.image.key}`;
          return (
            <img
              src={url}
              alt={primaryImage.image.alt ?? ""}
              className="h-12 w-12 rounded object-cover ring-1 ring-muted"
            />
          );
        })()}
        <RecipeActions recipeId={recipe.id} />
      </div>
    </Card>
  );
}
