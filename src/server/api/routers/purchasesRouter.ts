import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const purchasesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const purchases = await db.krogerPurchase.findMany({
      where: { userId },
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return purchases;
  }),
});


