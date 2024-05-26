"use client";

import { H1 } from "~/components/ui/typography";
import { api, type RouterOutputs } from "~/trpc/react";
import { useRecipeActions } from "../useRecipeActions";
import { PlanCard } from "./PlanCard";
import { RecipePickerPopover } from "./RecipePickerPopover";

export function PlanPageClient(props: {
  plans: RouterOutputs["recipe"]["getMealPlans"];
}) {
  const { plans: initPlans } = props;

  const { data: plans = initPlans } = api.recipe.getMealPlans.useQuery();

  // TODO: this filtering should be done on the server
  const _plansThisMonth = plans.filter((plan) => {
    // filter within -14 days and +14 days
    const date = new Date(plan.date);
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);

    return date >= fourteenDaysAgo && date <= fourteenDaysFromNow;
  });

  // sort by date
  const plansThisMonth = _plansThisMonth.sort((a, b) => {
    // verify they are dates
    if (!a?.date || !b?.date) {
      return 0;
    }

    // type guard for dates
    if (!(a.date instanceof Date) || !(b.date instanceof Date)) {
      return 0;
    }

    return a?.date?.getTime() - b?.date?.getTime();
  });

  const { handleAddToMealPlan } = useRecipeActions();

  return (
    <div className="flex flex-col gap-4">
      <H1>Planned Meals</H1>

      <div className="flex flex-wrap gap-2">
        {plansThisMonth.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}

        <div className="flex min-h-28 w-[276px] items-center justify-center rounded border border-gray-200">
          <RecipePickerPopover
            onRecipeSelected={async (recipeId) => {
              await handleAddToMealPlan(recipeId, new Date());
            }}
          />
        </div>
      </div>
    </div>
  );
}
