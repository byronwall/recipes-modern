"use client";

import Link from "next/link";
import { H4 } from "~/components/ui/typography";
import { type RouterOutputs } from "~/trpc/react";
import { useMealPlanActions } from "../useMealPlanActions";
import { Button } from "~/components/ui/button";

export function PlanCard(props: { plan: PlannedMealWithRecipe }) {
  const { plan } = props;

  const { handleDelete } = useMealPlanActions();

  return (
    <div className="w-80 rounded border border-gray-200 p-2">
      <Link href={`/recipes/${plan.Recipe.id}`}>
        <H4>{plan.Recipe.name}</H4>
      </Link>

      <div>{plan.date.toLocaleDateString()}</div>
      <div>{plan.isMade ? "made" : "not made"}</div>

      <Button onClick={() => handleDelete(plan.id)}>Delete</Button>
    </div>
  );
}
type PlannedMealWithRecipe = RouterOutputs["recipe"]["getMealPlans"][0];
