import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  // Return top N tags ordered by how many of the current user's recipes use them
  popular: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const grouped = await ctx.db.recipeTag.groupBy({
        by: ["tagId"],
        where: { recipe: { userId: ctx.session.user.id } },
        _count: { tagId: true },
        orderBy: { _count: { tagId: "desc" } },
        take: input.limit,
      });

      const tagIds = grouped.map((g) => g.tagId);
      if (tagIds.length === 0)
        return [] as Array<{
          id: number;
          slug: string;
          name: string;
          count: number;
        }>;

      const tags = await ctx.db.tag.findMany({ where: { id: { in: tagIds } } });
      const idToTag = new Map(tags.map((t) => [t.id, t]));

      return grouped
        .map((g) => ({
          id: g.tagId,
          slug: idToTag.get(g.tagId)?.slug ?? String(g.tagId),
          name: idToTag.get(g.tagId)?.name ?? String(g.tagId),
          count: g._count.tagId,
        }))
        .filter((t) => !!t.slug);
    }),

  // List all tags for the current user to pick from (by name asc)
  all: protectedProcedure
    .input(
      z.object({ limit: z.number().min(1).max(500).default(200) }).optional(),
    )
    .query(async ({ ctx, input }) => {
      // Returning all tags regardless of owner, but typically created by the user
      // This keeps things simple for shared tags in the future
      const limit = input?.limit ?? 200;
      const tags = await ctx.db.tag.findMany({
        take: limit,
        orderBy: { name: "asc" },
      });
      return tags;
    }),

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

  addTagToRecipe: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number(), tagSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId, userId: ctx.session.user.id },
      });
      if (!recipe) throw new Error("Recipe not found");

      const tag = await ctx.db.tag.findUnique({
        where: { slug: input.tagSlug },
      });
      if (!tag) throw new Error("Tag not found");

      await ctx.db.recipeTag.upsert({
        where: { recipeId_tagId: { recipeId: input.recipeId, tagId: tag.id } },
        update: {},
        create: { recipeId: input.recipeId, tagId: tag.id },
      });

      return { ok: true };
    }),

  removeTagFromRecipe: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number(), tagSlug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.db.recipe.findUnique({
        where: { id: input.recipeId, userId: ctx.session.user.id },
      });
      if (!recipe) throw new Error("Recipe not found");

      const tag = await ctx.db.tag.findUnique({
        where: { slug: input.tagSlug },
      });
      if (!tag) throw new Error("Tag not found");

      try {
        await ctx.db.recipeTag.delete({
          where: {
            recipeId_tagId: { recipeId: input.recipeId, tagId: tag.id },
          },
        });
      } catch {
        // ignore if not present
      }

      return { ok: true };
    }),
});
