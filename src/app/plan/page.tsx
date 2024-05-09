import { H1, H2 } from "~/components/ui/typography";
import { useData } from "../recipes/[id]/useData";
import { useEnforceAuth } from "../useEnforceAuth";
import { api } from "~/trpc/server";

export default async function PlanPage() {
  await useEnforceAuth();

  const plans = await api.recipe.getMealPlans();

  const plansThisMonth = plans.filter((plan) => {
    const date = new Date(plan.date);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  return (
    <div>
      <H1>Plan</H1>

      <H2>Plans this month</H2>
      <ul>
        {plansThisMonth.map((plan) => (
          <li key={plan.id}>
            {plan.recipeId}
            {plan.Recipe.name}
            {plan.date.toISOString()}
            {plan.isMade ? "made" : "not made"}
          </li>
        ))}
      </ul>

      <H2>All Meal Plans</H2>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id}>
            {plan.recipeId}
            {plan.Recipe.name}
            {plan.date.toISOString()}
            {plan.isMade ? "made" : "not made"}
          </li>
        ))}
      </ul>
    </div>
  );
}
