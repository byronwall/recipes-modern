import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { type API_KrogerAddCart } from "~/app/kroger/model";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { doKrogerSearch } from "~/server/kroger";
import { krogerRequest, logKroger } from "~/server/krogerAuth";
import { env } from "~/env";

export const krogerRouter = createTRPCRouter({
  searchProducts: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { query } = input;

      try {
        const results = await doKrogerSearch(
          {
            filterTerm: query,
          },
          ctx.session.user.id,
        );

        return results;
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err;
        logKroger("error", "Kroger search failed", {
          userId: ctx.session.user.id,
        });
        const message =
          err instanceof Error
            ? err.message
            : "Kroger search failed. Please try again later.";
        // Avoid non-serializable cause to prevent client transform errors
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),
  getKrogerStatus: protectedProcedure.query(async ({ input: _input, ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.userExtras.findUnique({
      where: {
        userId,
      },
    });

    return { connected: Boolean(user?.krogerUserAccessToken) };
  }),

  addToCart: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              upc: z.string(),
              quantity: z.number().int().positive(),
            }),
          )
          .min(1),
        listItemId: z.number().optional(),
        ingredientId: z.number().optional(),
        recipeId: z.number().optional(),
        purchaseDetails: z
          .object({
            sku: z.string(),
            productId: z.string(),
            name: z.string(),
            brand: z.string().optional(),
            categories: z.array(z.string()).optional(),
            itemId: z.string().optional(),
            soldBy: z.string().optional(),
            priceRegular: z.number().optional(),
            pricePromo: z.number().optional(),
            price: z.number().default(0),
            quantity: z.number().int().positive(),
            size: z.string(),
            imageUrl: z.string().default(""),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const requestId = crypto.randomUUID();
      const attempt = {
        requestId,
        userId,
        listItemId: input.listItemId,
        ingredientId: input.ingredientId,
        recipeId: input.recipeId,
        productName: input.purchaseDetails?.name,
        productId: input.purchaseDetails?.productId,
        sku: input.purchaseDetails?.sku,
        items: input.items,
        itemCount: input.items.length,
      };
      let createdPurchaseId: number | null = null;
      let stage = "validate_references";
      logKroger("info", "Kroger cart attempt started", attempt);
      try {
        const listItem =
          input.listItemId === undefined
            ? null
            : await db.shoppingList.findUniqueOrThrow({
                where: { id: input.listItemId, userId },
                select: { ingredientId: true, recipeId: true },
              });
        if (input.ingredientId !== undefined)
          await db.ingredient.findUniqueOrThrow({
            where: { id: input.ingredientId, group: { Recipe: { userId } } },
          });
        if (input.recipeId !== undefined)
          await db.recipe.findUniqueOrThrow({
            where: { id: input.recipeId, userId },
          });
        const postData = { items: input.items } as API_KrogerAddCart;
        const url = `https://api.kroger.com/v1/cart/add`;

        // Pre-create a purchase record so attempts are tracked even if API fails
        if (input.purchaseDetails) {
          stage = "resolve_purchase";

          let ingredientId: number | null = input.ingredientId ?? null;
          let recipeId: number | null = input.recipeId ?? null;
          if (input.listItemId) {
            ingredientId = listItem?.ingredientId ?? null;
            recipeId = listItem?.recipeId ?? null;
          }
          if (ingredientId && !recipeId) {
            const ingredient = await db.ingredient.findUnique({
              where: { id: ingredientId },
              select: {
                group: {
                  select: {
                    recipeId: true,
                  },
                },
              },
            });
            recipeId = ingredient?.group.recipeId ?? null;
          }

          stage = "create_purchase";
          const created = await db.krogerPurchase.create({
            data: {
              userId,
              ingredientId: ingredientId ?? undefined,
              recipeId: recipeId ?? undefined,
              krogerSku: input.purchaseDetails.sku,
              krogerProductId: input.purchaseDetails.productId,
              krogerName: input.purchaseDetails.name,
              krogerBrand: input.purchaseDetails.brand,
              krogerCategories: input.purchaseDetails.categories ?? [],
              krogerItemId: input.purchaseDetails.itemId,
              krogerSoldBy: input.purchaseDetails.soldBy,
              krogerPriceRegular: input.purchaseDetails.priceRegular,
              krogerPricePromo: input.purchaseDetails.pricePromo,
              price: input.purchaseDetails.price ?? 0,
              quantity: input.purchaseDetails.quantity,
              itemSize: input.purchaseDetails.size,
              imageUrl: input.purchaseDetails.imageUrl ?? "",
              // wasAddedToCart defaults false; note left empty initially
            },
            select: { id: true },
          });
          createdPurchaseId = created.id;
        }

        // If we are configured to skip adding to cart, add note and return success
        if (env.NEXT_SKIP_ADD_TO_CART === "true") {
          stage = "record_skipped_purchase";
          if (createdPurchaseId) {
            await db.krogerPurchase.update({
              where: { id: createdPurchaseId },
              data: { note: "Skipped due to SKIP_ADD_TO_CART=true" },
            });
          }
          return { result: true };
        }

        stage = "add_to_cart";
        const addResponse = await krogerRequest(
          userId,
          url,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          },
          requestId,
        );

        if (!addResponse.ok) {
          logKroger("error", "Kroger cart rejected", {
            requestId,
            userId,
            status: addResponse.status,
          });
          throw new Error("Kroger could not add this item. Please try again.");
        }

        logKroger("info", "Kroger cart accepted", {
          requestId,
          userId,
          purchaseId: createdPurchaseId,
        });

        // if things went well and we have an item id, mark it as bought
        if (input.listItemId) {
          stage = "mark_list_item_bought";
          await db.shoppingList.update({
            where: {
              id: input.listItemId,
              userId,
            },
            data: {
              isBought: true,
            },
          });
        }

        // Mark the pre-created purchase as successfully added
        if (createdPurchaseId) {
          stage = "mark_purchase_added";
          await db.krogerPurchase.update({
            where: { id: createdPurchaseId },
            data: { wasAddedToCart: true },
          });
        }

        logKroger("info", "Kroger cart attempt completed", {
          requestId,
          userId,
          purchaseId: createdPurchaseId,
          listItemId: input.listItemId,
        });
        return { result: true };
      } catch (error: unknown) {
        logKroger("error", "Kroger cart attempt failed", {
          ...attempt,
          purchaseId: createdPurchaseId,
          stage,
          code:
            error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR",
          errorName: error instanceof Error ? error.name : "UnknownError",
          // Prisma messages can include connection details and query values.
          databaseCode:
            error instanceof Prisma.PrismaClientKnownRequestError
              ? error.code
              : error instanceof Prisma.PrismaClientInitializationError
                ? error.errorCode
                : undefined,
          constraintFields:
            error instanceof Prisma.PrismaClientKnownRequestError &&
            Array.isArray(error.meta?.target)
              ? error.meta.target.filter(
                  (field): field is string => typeof field === "string",
                )
              : undefined,
        });
        if (createdPurchaseId) {
          const message =
            error instanceof TRPCError
              ? error.message
              : "Kroger could not add this item to the cart. Please try again.";
          // Append or set note on error
          await db.krogerPurchase.update({
            where: { id: createdPurchaseId },
            data: {
              note: message,
            },
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Kroger could not add this item to the cart. Please try again.",
        });
      }
    }),
});
