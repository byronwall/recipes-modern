import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
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

  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  getLatest: protectedProcedure.query(({ ctx }) => {
    return ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
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
  amount: any;
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
