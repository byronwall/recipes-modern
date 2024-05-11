"use client";

import { api } from "~/trpc/react";

export function useMealPlanActions() {
  const utils = api.useUtils();

  const deletePlan = api.recipe.deleteMealPlan.useMutation();

  const handleDelete = async (id: number) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this meal plan?",
    );
    if (!shouldDelete) {
      return;
    }

    await deletePlan.mutateAsync({ id });

    await utils.invalidate();
  };

  return { handleDelete };
}
