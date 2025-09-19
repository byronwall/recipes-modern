import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().optional().default(""),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const q = (input.q ?? "").trim().toLowerCase();
      const where = q
        ? {
            OR: [
              { slug: { contains: q } },
              { name: { contains: q, mode: "insensitive" as const } },
              { aliases: { has: q } },
            ],
          }
        : {};
      const tags = await ctx.db.tag.findMany({
        where,
        take: input.limit,
        orderBy: { name: "asc" },
      });
      return tags;
    }),

  upsertByName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(40) }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.name.trim().toLowerCase().replace(/\s+/g, "-");
      return ctx.db.tag.upsert({
        where: { slug },
        update: { name: input.name },
        create: { slug, name: input.name, createdBy: ctx.session.user.id },
      });
    }),

  setTagsForRecipe: protectedProcedure
    .input(
      z.object({ recipeId: z.coerce.number(), tagSlugs: z.array(z.string()) }),
    )
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId, userId: ctx.session.user.id },
      });
      if (!recipe) throw new Error("Recipe not found");

      const tags = await ctx.db.tag.findMany({
        where: { slug: { in: input.tagSlugs } },
      });

      await ctx.db.recipeTag.deleteMany({
        where: { recipeId: input.recipeId },
      });
      if (tags.length > 0) {
        await ctx.db.recipeTag.createMany({
          data: tags.map((t) => ({ recipeId: input.recipeId, tagId: t.id })),
          skipDuplicates: true,
        });
      }
      return { ok: true, count: tags.length };
    }),
});
