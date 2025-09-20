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
}

export type RecipeType =
  | "BREAKFAST"
  | "LUNCH"
  | "DINNER"
  | "DESSERT"
  | "SNACK"
  | "DRINK"
  | "OTHER";

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
