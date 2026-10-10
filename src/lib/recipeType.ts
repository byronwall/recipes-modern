import type { RecipeType } from "@prisma/client";

/** Display label for a recipe type enum value, e.g. `BREAKFAST` -> `Breakfast`. */
export function formatRecipeType(type: RecipeType | string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}
