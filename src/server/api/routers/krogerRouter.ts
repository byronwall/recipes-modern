import { z } from "zod";
import { type API_KrogerAddCart } from "~/app/kroger/model";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { doKrogerSearch } from "~/server/kroger";
import { getKrogerAccessToken } from "./getKrogerAccessToken";

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

      const results = await doKrogerSearch(
        {
          filterTerm: query,
        },
        ctx.session.user.id,
        true,
      );

      console.log("results", results);

      return results;
    }),
  getKrogerStatus: protectedProcedure.query(async ({ input, ctx }) => {
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const postData = input as API_KrogerAddCart;
      const url = `https://api.kroger.com/v1/cart/add`;

      const accessToken = await getKrogerAccessToken(ctx.session.user.id);

      try {
        const addResponse = await fetch(url, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(postData),
        });

        if (!addResponse.ok) {
          throw new Error("Request failed");
        }

        return { result: true };
      } catch (error) {
        return { result: false };
      }
    }),
});
