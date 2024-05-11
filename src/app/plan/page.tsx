import { H1, H2 } from "~/components/ui/typography";
import { api } from "~/trpc/server";
import { useEnforceAuth } from "../useEnforceAuth";
import { PlanCard } from "./PlanCard";

export default async function PlanPage() {
  await useEnforceAuth();

  const plans = await api.recipe.getMealPlans();

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

  return (
    <div>
      <H1>Plan</H1>

      <H2>Plans this month</H2>
      <div className="flex flex-wrap gap-2">
        {plansThisMonth.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
