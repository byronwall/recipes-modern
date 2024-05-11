import { H1, H2 } from "~/components/ui/typography";
import { api } from "~/trpc/server";
import { useEnforceAuth } from "../useEnforceAuth";
import { PlanCard } from "./PlanCard";

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
      <div className="flex flex-wrap gap-2">
        {plansThisMonth.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <H2>All Meal Plans</H2>
      <div className="">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
