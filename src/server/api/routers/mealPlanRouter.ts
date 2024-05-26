import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const mealPlanRouter = createTRPCRouter({
  updateMealPlan: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        isMade: z.boolean().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const plannedMeal = await db.plannedMeal.update({
        where: { id: input.id },
        data: {
          isMade: input.isMade,
          date: input.date,
        },
      });

      return plannedMeal;
    }),

  deleteMealPlan: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      const plannedMeal = await db.plannedMeal.delete({
        where: { id: input.id },
      });

      return plannedMeal;
    }),
});
