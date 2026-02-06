import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type API_KrogerAddCart } from "~/app/kroger/model";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { doKrogerSearch } from "~/server/kroger";
import { getKrogerAccessToken } from "./getKrogerAccessToken";
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

      console.log("do search", query);

      try {
        const results = await doKrogerSearch(
          {
            filterTerm: query,
          },
          ctx.session.user.id,
          true,
        );

        console.log("results", results);

        return results;
      } catch (err: unknown) {
        console.error("Kroger search failed", err);
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

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }),

  addToCart: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            upc: z.string(),
            quantity: z.number(),
          }),
        ),
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
            quantity: z.number(),
            size: z.string(),
            imageUrl: z.string().default(""),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const postData = { items: input.items } as API_KrogerAddCart;
      const url = `https://api.kroger.com/v1/cart/add`;

      // Pre-create a purchase record so attempts are tracked even if API fails
      let createdPurchaseId: number | null = null;
      if (input.purchaseDetails) {
        const userId = ctx.session.user.id;

        let ingredientId: number | null = input.ingredientId ?? null;
        let recipeId: number | null = input.recipeId ?? null;
        if (input.listItemId) {
          const listItem = await db.shoppingList.findUnique({
            where: { id: input.listItemId },
            select: { ingredientId: true, recipeId: true },
          });
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
        if (createdPurchaseId) {
          await db.krogerPurchase.update({
            where: { id: createdPurchaseId },
            data: { note: "Skipped due to SKIP_ADD_TO_CART=true" },
          });
        }
        return { result: true };
      }

      try {
        const accessToken = await getKrogerAccessToken(ctx.session.user.id);
        const addResponse = await fetch(url, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(postData),
        });

        if (!addResponse.ok) {
          const errorText = await addResponse.text().catch(() => "");
          if (createdPurchaseId) {
            await db.krogerPurchase.update({
              where: { id: createdPurchaseId },
              data: {
                note: `HTTP ${addResponse.status}: ${errorText || "Request failed"}`,
              },
            });
          }
          throw new Error("Request failed");
        }

        // if things went well and we have an item id, mark it as bought
        if (input.listItemId) {
          await db.shoppingList.update({
            where: {
              id: input.listItemId,
            },
            data: {
              isBought: true,
            },
          });
        }

        // Mark the pre-created purchase as successfully added
        if (createdPurchaseId) {
          await db.krogerPurchase.update({
            where: { id: createdPurchaseId },
            data: { wasAddedToCart: true },
          });
        }

        return { result: true };
      } catch (error: unknown) {
        if (createdPurchaseId) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          // Append or set note on error
          await db.krogerPurchase.update({
            where: { id: createdPurchaseId },
            data: {
              note: message,
            },
          });
        }
        return { result: false };
      }
    }),
});
