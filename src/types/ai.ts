import { type RecipeType } from "@prisma/client";

export interface GenerateRecipeConstraints {
  servings?: number;
  timeLimitMinutes?: number;
  diet?: string[];
  allergies?: string[];
  cuisine?: string;
  tools?: string[];
  skill?: string;
  spiceLevel?: string;
}

export type RegenerateScope = "ingredients" | "steps" | "all";

export interface GenerateRecipeRequest {
  prompt: string;
  constraints?: GenerateRecipeConstraints;
  regenerateScope?: RegenerateScope;
  /**
   * When generating multiple recipes in passes, previously generated recipes
   * can be provided to encourage variety and avoid duplication.
   */
  previousRecipes?: GeneratedRecipe[];
  /** 1-based index of the current pass when doing multi-pass generation */
  passIndex?: number;
  /** Total number of requested passes/recipes */
  totalPasses?: number;
}

export interface GeneratedRecipe {
  name: string;
  description: string;
  cookMinutes?: number;
  type?: RecipeType;
  tags?: string[];
  servings?: number;
  ingredientGroups: { title: string; ingredients: string[] }[];
  stepGroups: { title: string; steps: string[] }[];
}

export interface GenerateRecipeResponse {
  ok: boolean;
  recipe?: GeneratedRecipe;
  warnings?: string[];
  error?: string;
}
