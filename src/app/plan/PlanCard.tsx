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
import { TooltipButton } from "~/components/ui/tooltip-button";

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
      className={cn(
        "flex h-full min-h-[190px] flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm",
        {
          "bg-muted/60 text-muted-foreground": plan.isMade,
        },
      )}
    >
      <div className="flex items-start gap-3">
        <StylishDatePicker value={plan.date} onChange={handleDateChange} />

        <div className="flex min-h-[76px] flex-1 flex-col gap-2">
          <Link href={`/recipes/${plan.Recipe.id}`}>
            <H4 className="line-clamp-2 leading-tight">{plan.Recipe.name}</H4>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-0.5">
              {plan.Recipe.type}
            </span>
            {plan.isMade && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                made
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2">
        <div className="flex items-center gap-2">
          <TooltipButton content="Delete meal">
            <Button
              onClick={() => handleDelete(plan.id)}
              variant="destructive-outline"
              size="icon"
              aria-label="Delete meal"
            >
              <Trash size={16} />
            </Button>
          </TooltipButton>
          <TooltipButton
            content={plan.isOnShoppingList ? "Already on list" : "Add to list"}
          >
            <Button
              onClick={() => addMealPlanToList.mutateAsync({ id: plan.id })}
              disabled={addMealPlanToList.isPending || plan.isOnShoppingList}
              size="icon"
              variant="outline"
              aria-label="Add to list"
            >
              <ShoppingBasket />
            </Button>
          </TooltipButton>
        </div>
        <TooltipButton content={plan.isMade ? "Mark not made" : "Mark made"}>
          <Button
            onClick={() => {
              updatePlan.mutate({
                id: plan.id,
                isMade: !plan.isMade,
              });
            }}
            disabled={updatePlan.isPending}
            size="sm"
          >
            {plan.isMade ? "Not made" : "Made"}
          </Button>
        </TooltipButton>
      </div>
    </div>
  );
}
