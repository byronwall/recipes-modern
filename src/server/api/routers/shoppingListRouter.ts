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
        ingredient: {
          include: {
            group: {
              select: {
                title: true,
              },
            },
          },
        },
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
        ingredient: z.string().trim().min(1),
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
        where: { id: input.recipeId, userId },
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
    .mutation(async ({ input, ctx }) =>
      db.$transaction(async (tx) => {
        const shoppingList = await tx.shoppingList.delete({
          where: { id: input.id, userId: ctx.session.user.id },
        });

        await tx.plannedMeal.updateMany({
          where: {
            userId: ctx.session.user.id,
            isMade: false,
            Recipe: { ShoppingList: { none: { userId: ctx.session.user.id } } },
          },
          data: { isOnShoppingList: false },
        });
        return shoppingList;
      }),
    ),

  deleteRecipeFromShoppingList: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number() }))
    .mutation(async ({ input, ctx }) =>
      db.$transaction(async (tx) => {
        const shoppingList = await tx.shoppingList.deleteMany({
          where: { recipeId: input.recipeId, userId: ctx.session.user.id },
        });

        // need to search through meal plans and reset any that have this recipe
        await tx.plannedMeal.updateMany({
          where: {
            recipeId: input.recipeId,
            userId: ctx.session.user.id,
            isMade: false,
          },
          data: { isOnShoppingList: false },
        });

        return shoppingList;
      }),
    ),

  markItemAsBought: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input, ctx }) => {
      // get current state and toggle it
      const item = await db.shoppingList.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      const shoppingList = await db.shoppingList.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: {
          isBought: !item.isBought,
        },
      });

      return shoppingList;
    }),

  deleteAllItemsFromShoppingList: protectedProcedure.mutation(async ({ ctx }) =>
    db.$transaction(async (tx) => {
      const userId = ctx.session.user.id;

      const shoppingList = await tx.shoppingList.deleteMany({
        where: { userId },
      });

      await tx.plannedMeal.updateMany({
        where: {
          userId: ctx.session.user.id,
          isMade: false,
          Recipe: { ShoppingList: { none: { userId: ctx.session.user.id } } },
        },
        data: { isOnShoppingList: false },
      });
      return shoppingList;
    }),
  ),

  deleteAllBoughtItemsFromShoppingList: protectedProcedure.mutation(
    async ({ ctx }) =>
      db.$transaction(async (tx) => {
        const userId = ctx.session.user.id;

        const shoppingList = await tx.shoppingList.deleteMany({
          where: { userId, isBought: true },
        });

        await tx.plannedMeal.updateMany({
          where: {
            userId: ctx.session.user.id,
            isMade: false,
            Recipe: { ShoppingList: { none: { userId: ctx.session.user.id } } },
          },
          data: { isOnShoppingList: false },
        });
        return shoppingList;
      }),
  ),
});
