import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { type Prisma } from "@prisma/client";

export const shoppingListRouter = createTRPCRouter({
  // shopping list actions: add loose item, add recipe, remove item, remove recipe
  // more actions: mark item as bought, delete all, delete all bought
  getShoppingList: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const shoppingList = db.shoppingList.findMany({
      where: { userId },
      include: {
        ingredient: true,
        Recipe: {
          select: {
            name: true,
            id: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return shoppingList;
  }),

  addLooseItemToShoppingList: protectedProcedure
    .input(
      z.object({
        ingredient: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const shoppingList = await db.shoppingList.create({
        data: {
          looseItem: input.ingredient,
          userId,
        },
      });

      return shoppingList;
    }),

  addRecipeToShoppingList: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // include all ingredients from the recipe
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId },
        include: {
          ingredientGroups: {
            include: { ingredients: true },
          },
        },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const newListItems = recipe.ingredientGroups.flatMap((group) =>
        group.ingredients.map<Prisma.ShoppingListCreateManyInput>(
          (ingredient) => ({
            userId,
            recipeId: input.recipeId,
            ingredientId: ingredient.id,
          }),
        ),
      );

      // add every ingredient to the list
      const shoppingList = await db.shoppingList.createMany({
        data: newListItems,
      });

      return shoppingList;
    }),

  deleteItemFromShoppingList: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      const shoppingList = await db.shoppingList.delete({
        where: { id: input.id },
      });

      return shoppingList;
    }),

  deleteRecipeFromShoppingList: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number() }))
    .mutation(async ({ input }) => {
      const shoppingList = await db.shoppingList.deleteMany({
        where: { recipeId: input.recipeId },
      });

      // need to search through meal plans and reset any that have this recipe
      await db.plannedMeal.updateMany({
        where: { recipeId: input.recipeId, isMade: false },
        data: { isOnShoppingList: false },
      });

      return shoppingList;
    }),

  markItemAsBought: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      // get current state and toggle it
      const item = await db.shoppingList.findUnique({
        where: { id: input.id },
      });

      const shoppingList = await db.shoppingList.update({
        where: { id: input.id },
        data: {
          isBought: !item?.isBought,
        },
      });

      return shoppingList;
    }),

  deleteAllItemsFromShoppingList: protectedProcedure.mutation(
    async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const shoppingList = await db.shoppingList.deleteMany({
        where: { userId },
      });

      return shoppingList;
    },
  ),

  deleteAllBoughtItemsFromShoppingList: protectedProcedure.mutation(
    async ({ ctx }) => {
      const userId = ctx.session.user.id;

      const shoppingList = await db.shoppingList.deleteMany({
        where: { userId, isBought: true },
      });

      return shoppingList;
    },
  ),
});
