"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { H4 } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { useMealPlanActions } from "../useMealPlanActions";
import { ShoppingBasket, Trash } from "lucide-react";
import { useRecipeActions } from "../useRecipeActions";
import { StylishDatePicker } from "./StylishDatePicker";

type PlannedMealWithRecipe = RouterOutputs["recipe"]["getMealPlans"][0];

export function PlanCard(props: { plan: PlannedMealWithRecipe }) {
  const { plan } = props;

  const { handleDelete } = useMealPlanActions();
  const { addMealPlanToList } = useRecipeActions();

  const updatePlan = api.mealPlan.updateMealPlan.useMutation();

  function handleDateChange(date: Date | undefined): void {
    if (!date) return;
    updatePlan.mutate({
      id: plan.id,
      date: date,
    });
  }

  return (
    <div
      className={cn("w-[276px] rounded border border-gray-200 p-2", {
        "bg-gray-200 text-gray-700": plan.isMade,
      })}
    >
      <div className="flex gap-2 ">
        <StylishDatePicker value={plan.date} onChange={handleDateChange} />

        <div className="flex flex-col gap-1">
          <Link href={`/recipes/${plan.Recipe.id}`}>
            <H4>{plan.Recipe.name}</H4>
          </Link>
          <div>{plan.isMade ? "made" : "not made"}</div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleDelete(plan.id)}
              variant="destructive-outline"
            >
              <Trash size={16} />
            </Button>
            <Button
              onClick={() => addMealPlanToList.mutateAsync({ id: plan.id })}
              disabled={addMealPlanToList.isPending || plan.isOnShoppingList}
            >
              <ShoppingBasket />
            </Button>
            <Button
              onClick={() => {
                updatePlan.mutate({
                  id: plan.id,
                  isMade: !plan.isMade,
                });
              }}
              disabled={updatePlan.isPending}
            >
              {plan.isMade ? "Not made" : "Made"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
