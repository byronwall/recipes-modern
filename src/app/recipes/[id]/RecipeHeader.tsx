"use client";

import { H2 } from "~/components/ui/typography";
import { RecipeMetaInline } from "~/components/recipes/RecipeMetaInline";
import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { RecipeActionsPanel } from "./RecipeActionsPanel";
import { RecipeEditDialog } from "./RecipeEditDialog";
import { type Recipe } from "./recipe-types";

export function RecipeHeader(props: { recipe: Recipe }) {
  const { recipe } = props;
  return (
    <PageHeaderCard className="p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <H2 className="flex items-center gap-2 border-b-0 pb-0">
              <span>{recipe.name}</span>
            </H2>
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
  );
}
