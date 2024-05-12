export interface Root {
  recipes: Recipe[];
  ingredients: Ingredient2[];
  plannedMeals: PlannedMeal[];
  shoppingList: ShoppingList[];
  userAccessToken: string;
  userRefreshToken: string;
}

export interface Recipe {
  name: string;
  description: string;
  id: number;
  ingredientGroups: IngredientGroup[];
  stepGroups: StepGroup[];
}

export interface IngredientGroup {
  title: string;
  ingredients: Ingredient[];
}

export interface Ingredient {
  amount: string;
  ingredientId: number;
  modifier: string;
  unit: string;
}

export interface StepGroup {
  title: string;
  steps: Step[];
}

export interface Step {
  description: string;
  duration: string;
}

export interface Ingredient2 {
  id: number;
  name: string;
  plu: string;
  isGoodName: boolean;
  aisle?: string;
  comments?: string;
}

export interface PlannedMeal {
  date: string;
  recipeId: number;
  isMade: boolean;
  isOnShoppingList: boolean;
  scale: number;
  id: number;
}

export interface ShoppingList {
  ingredientAmount: IngredientAmount;
  recipeId: number;
  isBought: boolean;
  id: number;
}

export interface IngredientAmount {
  amount: string;
  ingredientId: number;
  modifier: string;
  unit: string;
}
