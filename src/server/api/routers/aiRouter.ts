import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { callOpenAI, parseAndValidate } from "~/server/ai/aiRecipe";
import type { GeneratedRecipe } from "~/types/ai";

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
});
