"use client";

import { api } from "~/trpc/react";

export function useMealPlanActions() {
  const deletePlan = api.mealPlan.deleteMealPlan.useMutation();

  const handleDelete = async (id: number) => {
    const shouldDelete = confirm(
      "Are you sure you want to delete this meal plan?",
    );
    if (!shouldDelete) {
      return;
    }

    await deletePlan.mutateAsync({ id });
  };

  const updatePlan = api.mealPlan.updateMealPlan.useMutation();

  const handleUpdate = async (id: number, isMade: boolean) => {
    await updatePlan.mutateAsync({ id, isMade });
  };

  return { handleDelete, handleUpdate };
}
