"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RecipeMetaInline } from "~/components/recipes/RecipeMetaInline";
import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { RecipeActionsPanel } from "./RecipeActionsPanel";
import { RecipeEditDialog } from "./RecipeEditDialog";
import { type Recipe } from "./recipe-types";

export function RecipeHeader(props: { recipe: Recipe }) {
  const { recipe } = props;
  return (
    <div className="space-y-3">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:no-underline"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" />
        All recipes
      </Link>
      <PageHeaderCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start gap-1">
              <h1 className="min-w-0 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {recipe.name}
              </h1>
              <RecipeEditDialog recipe={recipe} />
            </div>

            {recipe.description &&
            recipe.description.trim().toLowerCase() !== "desc" ? (
              <p className="max-w-prose text-muted-foreground">
                {recipe.description}
              </p>
            ) : null}

            <RecipeMetaInline recipe={recipe} />
          </div>

          <RecipeActionsPanel recipeId={recipe.id} />
        </div>
      </PageHeaderCard>
    </div>
  );
}
