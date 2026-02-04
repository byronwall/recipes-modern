import { z } from "zod";
import { faker } from "@faker-js/faker";
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

      const purchases = Array.from({ length: count }, () => {
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
