import { z } from "zod";
import { faker } from "@faker-js/faker";
import { type Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

const purchaseInclude = {
  Recipe: {
    select: {
      id: true,
      name: true,
    },
  },
  ingredient: {
    include: {
      group: {
        select: {
          Recipe: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.KrogerPurchaseInclude;

type PurchaseWithRelations = Prisma.KrogerPurchaseGetPayload<{
  include: typeof purchaseInclude;
}>;

function toDisplayPurchase(purchase: PurchaseWithRelations) {
  const linkedRecipe = purchase.ingredient?.group?.Recipe ?? purchase.Recipe;
  return {
    ...purchase,
    ingredientName: purchase.ingredient?.ingredient ?? null,
    linkedRecipe: linkedRecipe
      ? { id: linkedRecipe.id, name: linkedRecipe.name }
      : null,
  };
}

export const purchasesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const purchases = await db.krogerPurchase.findMany({
      where: { userId },
      include: purchaseInclude,
      orderBy: { createdAt: "desc" },
    });
    return purchases.map(toDisplayPurchase);
  }),

  recentByIngredientIds: protectedProcedure
    .input(
      z.object({
        ingredientIds: z.array(z.coerce.number().int().positive()).max(300),
        limit: z.coerce.number().int().min(1).max(10).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const ingredientIds = Array.from(new Set(input.ingredientIds));
      const limit = input.limit ?? 3;

      if (ingredientIds.length === 0) {
        return { ingredientPurchases: [] as const };
      }

      const purchases = await db.krogerPurchase.findMany({
        where: {
          userId,
          ingredientId: { in: ingredientIds },
        },
        include: purchaseInclude,
        orderBy: { createdAt: "desc" },
      });

      const grouped = new Map<number, ReturnType<typeof toDisplayPurchase>[]>();
      for (const purchase of purchases) {
        if (!purchase.ingredientId) continue;
        const group = grouped.get(purchase.ingredientId) ?? [];
        if (group.length < limit) {
          group.push(toDisplayPurchase(purchase));
          grouped.set(purchase.ingredientId, group);
        }
      }

      return {
        ingredientPurchases: ingredientIds.map((ingredientId) => ({
          ingredientId,
          purchases: grouped.get(ingredientId) ?? [],
        })),
      };
    }),

  ingredientsCatalog: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const ingredients = await db.ingredient.findMany({
      where: {
        group: {
          Recipe: {
            userId,
          },
        },
      },
      include: {
        group: {
          select: {
            Recipe: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ ingredient: "asc" }, { id: "asc" }],
    });

    if (ingredients.length === 0) {
      return [];
    }

    const ingredientIds = ingredients.map((ingredient) => ingredient.id);
    const purchases = await db.krogerPurchase.findMany({
      where: {
        userId,
        ingredientId: { in: ingredientIds },
      },
      include: purchaseInclude,
      orderBy: { createdAt: "desc" },
    });

    const groupByName = new Map<
      string,
      {
        key: string;
        name: string;
        ingredientIds: number[];
        aisleVotes: Record<string, number>;
        recipes: Map<number, { id: number; name: string }>;
      }
    >();

    for (const ingredient of ingredients) {
      const normalized = ingredient.ingredient.trim().toLowerCase();
      const key = normalized || String(ingredient.id);
      const existing = groupByName.get(key);
      if (existing) {
        existing.ingredientIds.push(ingredient.id);
        existing.recipes.set(ingredient.group.Recipe.id, {
          id: ingredient.group.Recipe.id,
          name: ingredient.group.Recipe.name,
        });
        const aisle = ingredient.aisle?.trim();
        if (aisle) {
          existing.aisleVotes[aisle] = (existing.aisleVotes[aisle] ?? 0) + 1;
        }
      } else {
        groupByName.set(key, {
          key,
          name: ingredient.ingredient.trim() || ingredient.ingredient,
          ingredientIds: [ingredient.id],
          aisleVotes: ingredient.aisle?.trim()
            ? { [ingredient.aisle.trim()]: 1 }
            : {},
          recipes: new Map([
            [
              ingredient.group.Recipe.id,
              {
                id: ingredient.group.Recipe.id,
                name: ingredient.group.Recipe.name,
              },
            ],
          ]),
        });
      }
    }

    const ingredientKeyById = new Map<number, string>();
    for (const group of groupByName.values()) {
      for (const id of group.ingredientIds) {
        ingredientKeyById.set(id, group.key);
      }
    }

    const purchaseCountByKey = new Map<string, number>();
    const purchasesByKey = new Map<string, ReturnType<typeof toDisplayPurchase>[]>();

    for (const purchase of purchases) {
      if (!purchase.ingredientId) continue;
      const key = ingredientKeyById.get(purchase.ingredientId);
      if (!key) continue;

      purchaseCountByKey.set(key, (purchaseCountByKey.get(key) ?? 0) + 1);

      const current = purchasesByKey.get(key) ?? [];
      if (current.length < 3) {
        current.push(toDisplayPurchase(purchase));
        purchasesByKey.set(key, current);
      }
    }

    const results = Array.from(groupByName.values()).map((group) => {
      const sortedRecipes = Array.from(group.recipes.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
      const topAisle =
        Object.entries(group.aisleVotes).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        null;
      return {
        id: group.key,
        ingredient: group.name,
        ingredientIds: group.ingredientIds,
        aisle: topAisle,
        recipes: sortedRecipes,
        purchaseCount: purchaseCountByKey.get(group.key) ?? 0,
        recentPurchases: purchasesByKey.get(group.key) ?? [],
      };
    });

    return results.sort((a, b) =>
      a.ingredient.localeCompare(b.ingredient, undefined, {
        sensitivity: "base",
      }),
    );
  }),

  seedDevPurchases: protectedProcedure
    .input(
      z
        .object({
          count: z.number().int().min(1).max(50).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Seed purchases are only available in development.");
      }

      const userId = ctx.session.user.id;
      const count = input?.count ?? 12;
      const ingredients = await db.ingredient.findMany({
        where: {
          group: {
            Recipe: {
              userId,
            },
          },
        },
        select: {
          id: true,
          group: {
            select: {
              recipeId: true,
            },
          },
        },
      });

      if (ingredients.length === 0) {
        throw new Error(
          "No ingredients found. Seed or create recipes before seeding purchases.",
        );
      }

      const purchases = Array.from({ length: count }, () => {
        const ingredient =
          ingredients[faker.number.int({ min: 0, max: ingredients.length - 1 })]!;
        const size = faker.number.int({ min: 6, max: 48 });
        const price = Number(faker.commerce.price({ min: 1.5, max: 12 }));
        const regularPrice = Number(
          faker.commerce.price({ min: 1.5, max: 12 }),
        );
        const promoPrice =
          faker.datatype.boolean() && regularPrice > 0
            ? Number(faker.commerce.price({ min: 0.5, max: regularPrice }))
            : null;
        return {
          userId,
          ingredientId: ingredient.id,
          recipeId: ingredient.group.recipeId,
          krogerSku: faker.string.numeric({ length: 12 }),
          krogerProductId: faker.string.numeric({ length: 8 }),
          krogerName: faker.commerce.productName(),
          krogerBrand: faker.company.name(),
          krogerCategories: faker.helpers.arrayElements(
            ["Produce", "Dairy", "Pantry", "Meat", "Frozen", "Snacks"],
            faker.number.int({ min: 1, max: 2 }),
          ),
          krogerItemId: faker.string.numeric({ length: 6 }),
          krogerSoldBy: faker.helpers.arrayElement(["UNIT", "LB", "EA"]),
          krogerPriceRegular: regularPrice,
          krogerPricePromo: promoPrice ?? undefined,
          price,
          quantity: faker.number.int({ min: 1, max: 4 }),
          itemSize: `${size} oz`,
          imageUrl: faker.image.urlLoremFlickr({
            category: "food",
            width: 256,
            height: 256,
          }),
          wasAddedToCart: faker.datatype.boolean(),
          note: faker.helpers.maybe(() => faker.lorem.sentence(), {
            probability: 0.15,
          }),
        };
      });

      await db.krogerPurchase.createMany({
        data: purchases,
      });

      return { created: purchases.length };
    }),
});
