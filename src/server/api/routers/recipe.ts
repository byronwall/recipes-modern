import { IngredientGroup as IGP, Ingredient as IG } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const recipeRouter = createTRPCRouter({
  getRecipes: publicProcedure.query(async () => {
    // get data from http://recipes.byroni.us/api/db

    const recipes = db.recipe.findMany();
    return recipes;
  }),

  getRecipe: publicProcedure
    .input(z.object({ id: z.coerce.number() }))
    .query(async ({ input }) => {
      const recipe = await db.recipe.findUnique({
        where: { id: input.id },
        include: {
          stepGroups: {
            include: { Recipe: true },
          },
          ingredientGroups: {
            include: { ingredients: true },
          },
        },
      });

      return recipe;
    }),

  getMealPlans: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const plannedMeals = db.plannedMeal.findMany({
      where: { userId },
      include: { Recipe: true },
    });

    return plannedMeals;
  }),

  /*
  type NewRecipe = {
  title: string;
  ingredients: string;
  steps: string;
};
*/
  createRecipeFromTextInput: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        ingredients: z.string(),
        steps: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Initialize an empty array to hold group objects

      const ingredientGroups = splitTextIntoHeaderAndItems(
        input.ingredients,
      ).map((group, index) => ({
        title: group.title,
        order: index,
        ingredients: group.items.map((item) => {
          return {
            ingredient: item,
            rawInput: item,
          };
        }),
      }));

      const stepGroups = splitTextIntoHeaderAndItems(input.steps).map(
        (group, index) => ({
          title: group.title,
          order: index,
          steps: group.items,
        }),
      );

      // Creating the recipe along with ingredient groups and step groups in a single command
      const newRecipe = await db.recipe.create({
        data: {
          name: input.title,
          description: input.description,
          userId,
          ingredientGroups: {
            create: ingredientGroups.map((group) => ({
              title: group.title,
              order: group.order,
              ingredients: {
                create: group.ingredients,
              },
            })),
          },
          stepGroups: {
            create: stepGroups.map((group) => ({
              title: group.title,
              order: group.order,
              steps: group.steps,
            })),
          },
        },
        include: {
          ingredientGroups: {
            include: {
              ingredients: true,
            },
          },
          stepGroups: {
            include: {
              Recipe: true,
            },
          },
        },
      });

      return newRecipe;
    }),

  deleteRecipe: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      const recipe = await db.recipe.delete({
        where: { id: input.id },
      });

      return recipe;
    }),

  // code below is related to migrating old data structures to new database
  migrateRecipes: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // need to insert all of the

    const data = await fetch("http://recipes.byroni.us/api/db");

    const root = (await data.json()) as Root;

    // create lookup of ingredients by id
    const ingredientsById = root.ingredients.reduce(
      (acc, ingredient) => {
        acc[ingredient.id] = ingredient;
        return acc;
      },
      {} as Record<number, Ingredient2>,
    );

    // insert all recipes
    for (const recipe of root.recipes) {
      const newRecipe = await db.recipe.create({
        data: {
          name: recipe.name,
          description: recipe.description,
          userId,
        },
      });

      // insert all steps
      let stepIndex = 0;
      for (const stepGroup of recipe.stepGroups) {
        await db.stepGroup.create({
          data: {
            title: stepGroup.title,
            steps: stepGroup.steps.map((step) => step.description),
            recipeId: newRecipe.id,
            order: stepIndex++,
          },
        });
      }

      // insert all ingredients
      let ingredientIndex = 0;
      for (const ingredientGroup of recipe.ingredientGroups) {
        const newIngredientGroup = await db.ingredientGroup.create({
          data: {
            title: ingredientGroup.title,
            recipeId: newRecipe.id,
            order: ingredientIndex++,
          },
        });

        for (const ingredient of ingredientGroup.ingredients) {
          // force each ingredient group into a new ingredient in the main table
          // this removes the old mapping
          const oldIngredient = ingredientsById[ingredient.ingredientId];

          if (!oldIngredient) {
            continue;
          }

          await db.ingredient.create({
            data: {
              ingredient: oldIngredient.name,
              plu: oldIngredient.plu,
              isGoodName: oldIngredient.isGoodName,
              aisle: oldIngredient.aisle,
              comments: oldIngredient.comments,
              amount: String(ingredient.amount),
              modifier: ingredient.modifier,
              unit: ingredient.unit,
              groupId: newIngredientGroup.id,
            },
          });
        }
      }

      // migrate the meal plans too
      const plannedMeals = root.plannedMeals.filter(
        (meal) => meal.recipeId === recipe.id,
      );

      for (const plannedMeal of plannedMeals) {
        await db.plannedMeal.create({
          data: {
            date: plannedMeal.date,
            recipeId: newRecipe.id,
            isMade: plannedMeal.isMade,
            isOnShoppingList: plannedMeal.isOnShoppingList,
            scale: plannedMeal.scale,
            userId,
          },
        });
      }
    }
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

function splitTextIntoHeaderAndItems(text: string) {
  const lines = text.split("\n");

  const headerRegEx = /^\[(.+?)\]$/;

  const groups: { title: string; items: string[] }[] = [];

  let currentGroup: { title: string; items: string[] } | null = null;

  for (const _line of lines) {
    const line = _line.trim();

    if (!line) {
      continue;
    }

    const headerMatch = line.match(headerRegEx);

    if (headerMatch) {
      if (currentGroup) {
        groups.push(currentGroup);
      }

      currentGroup = {
        title: headerMatch[1] ?? "Unknown",
        items: [],
      };
    } else if (currentGroup) {
      currentGroup.items.push(line);
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}
