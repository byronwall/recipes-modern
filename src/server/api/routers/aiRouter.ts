import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { callOpenAI, parseAndValidate } from "~/server/ai/aiRecipe";

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
      const aiJson = await callOpenAI({
        prompt: input.prompt,
        constraints: input.constraints,
        regenerateScope: input.regenerateScope,
      });
      const { recipe, warnings } = parseAndValidate(aiJson);
      return { ok: true as const, recipe, warnings: warnings ?? [] };
    }),
});
