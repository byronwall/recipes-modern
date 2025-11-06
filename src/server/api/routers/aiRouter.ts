import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { callOpenAI, parseAndValidate } from "~/server/ai/aiRecipe";
import type { GeneratedRecipe } from "~/types/ai";
import { callOpenAITouchUp } from "~/server/ai/aiTouchUp";
import { db } from "~/server/db";

const constraintsSchema = z
  .object({
    servings: z.number().int().positive().optional(),
    timeLimitMinutes: z.number().int().positive().optional(),
    diet: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    cuisine: z.string().optional(),
    tools: z.array(z.string()).optional(),
    skill: z.string().optional(),
    spiceLevel: z.string().optional(),
  })
  .optional();

const regenerateScopeSchema = z
  .enum(["ingredients", "steps", "all"])
  .optional();

export const aiRouter = createTRPCRouter({
  generateRecipe: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        constraints: constraintsSchema,
        regenerateScope: regenerateScopeSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const aiJson: unknown = await callOpenAI({
        prompt: input.prompt,
        constraints: input.constraints,
        regenerateScope: input.regenerateScope,
      });
      const { recipe, warnings } = parseAndValidate(aiJson);
      return { ok: true as const, recipe, warnings: warnings ?? [] };
    }),
  generateRecipes: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        constraints: constraintsSchema,
        regenerateScope: regenerateScopeSchema,
        count: z.number().int().min(1).max(8).default(3),
      }),
    )
    .mutation(async ({ input }) => {
      const results: Array<{ recipe: GeneratedRecipe; warnings: string[] }> =
        [];
      const totalPasses = input.count ?? 3;
      for (let i = 0; i < totalPasses; i++) {
        const previousRecipes = results.map((r) => r.recipe);
        const aiJson: unknown = await callOpenAI({
          prompt: input.prompt,
          constraints: input.constraints,
          regenerateScope: input.regenerateScope,
          previousRecipes,
          passIndex: i + 1,
          totalPasses,
        });
        const { recipe, warnings } = parseAndValidate(aiJson);
        results.push({ recipe, warnings: warnings ?? [] });
      }
      return { ok: true as const, results };
    }),
  touchUpRecipe: protectedProcedure
    .input(
      z.object({
        recipeId: z.coerce.number(),
        prompt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId, userId },
        include: {
          ingredientGroups: {
            include: { ingredients: true },
            orderBy: { order: "asc" },
          },
          stepGroups: { orderBy: { order: "asc" } },
        },
      });
      if (!recipe) throw new Error("Recipe not found");

      const current = {
        name: recipe.name,
        description: recipe.description,
        ingredientGroups: recipe.ingredientGroups
          .sort((a, b) => a.order - b.order)
          .map((g) => ({
            title: g.title,
            ingredients: g.ingredients
              .map((i) => {
                const composed = [i.amount, i.modifier, i.unit, i.ingredient]
                  .filter((p) => Boolean(p && String(p).trim().length > 0))
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim();
                const original =
                  i.rawInput && i.rawInput.trim().length > 0
                    ? i.rawInput
                    : composed || i.ingredient;
                return original;
              })
              .filter((s) => Boolean(s && s.trim().length > 0)),
          })),
        stepGroups: (() => {
          const sorted = recipe.stepGroups
            .slice()
            .sort((a, b) => a.order - b.order);
          const single = sorted.length <= 1;
          return sorted.map((g, idx) => {
            const rawTitle = (g.title ?? "").trim();
            const title =
              rawTitle || (single ? "All Steps" : `Group ${idx + 1}`);
            return { title, steps: g.steps };
          });
        })(),
      };

      const result = await callOpenAITouchUp({ prompt: input.prompt, current });
      return { ok: true as const, result };
    }),
});
