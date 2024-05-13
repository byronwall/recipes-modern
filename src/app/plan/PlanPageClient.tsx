"use client";

import { Button } from "~/components/ui/button";
import { H1, H2 } from "~/components/ui/typography";
import { api, type RouterOutputs } from "~/trpc/react";
import { useRadioList } from "../list/useRadioList";
import { PlanCard } from "./PlanCard";
import { useRecipeActions } from "../useRecipeActions";
import { ReplyIcon } from "lucide-react";
import { MealPlanThreeWeekView } from "./MealPlanThreeWeekView";

const renderModes = ["list", "calendar"] as const;

export function PlanPageClient(props: {
  plans: RouterOutputs["recipe"]["getMealPlans"];
}) {
  const { plans: initPlans } = props;

  const { data: plans = initPlans } = api.recipe.getMealPlans.useQuery();

  // TODO: this filtering should be done on the server
  const plansThisMonth = plans.filter((plan) => {
    // filter within -14 days and +14 days
    const date = new Date(plan.date);
    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(now.getDate() + 14);

    return date >= fourteenDaysAgo && date <= fourteenDaysFromNow;
  });
  plansThisMonth.sort((a, b) => a.date.getTime() - b.date.getTime());

  const { groupMode, radioGroupComp } = useRadioList(renderModes, "calendar");

  const { handleAddToMealPlan, handleDeleteFromMealPlan } = useRecipeActions();

  return (
    <div>
      <H1>Plan</H1>

      <H2>Render mode</H2>
      <div className="flex gap-2">{radioGroupComp}</div>

      <H2>Plans this month</H2>
      {groupMode === "list" && (
        <div className="flex flex-wrap gap-2">
          {plansThisMonth.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {groupMode === "calendar" && (
        <div>
          <MealPlanThreeWeekView
            itemRenderer={(date) => {
              const plan = plans.find(
                (plan) => plan.date.toDateString() === date.toDateString(),
              );
              if (!plan) {
                return null;
              }

              return (
                <div className="">
                  <p>{plan.Recipe.name}</p>
                  <Button onClick={() => handleDeleteFromMealPlan(plan.id)}>
                    <ReplyIcon />
                  </Button>
                </div>
              );
            }}
            onAction={async (date, recipeId) => {
              await handleAddToMealPlan(recipeId, date);
            }}
          />
        </div>
      )}
    </div>
  );
}
