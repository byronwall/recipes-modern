import { z } from "zod";
import bcrypt from "bcrypt";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const recipeRouter = createTRPCRouter({
  getRecipes: publicProcedure.query(async () => {
    // get data from http://recipes.byroni.us/api/db

    const data = await fetch("http://recipes.byroni.us/api/db");

    return data.json() as Promise<Root>;
  }),

  getRecipe: publicProcedure
    .input(z.object({ id: z.coerce.number() }))
    .query(async ({ input }) => {
      // get data from http://recipes.byroni.us/api/db

      const data = await fetch("http://recipes.byroni.us/api/db");

      const root = (await data.json()) as Root;

      return root.recipes.find((recipe) => recipe.id === input.id);
    }),
});

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // hash the password

      console.log("trying to create user", input);

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
        },
      });

      return user;
    }),
});

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
