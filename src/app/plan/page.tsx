import { helpers } from "~/trpc/server";
import { useEnforceAuth } from "../useEnforceAuth";
import { PlanPageClient } from "./PlanPageClient";

export default async function PlanPage() {
  await useEnforceAuth();

  const plans = await helpers.recipe.getMealPlans.fetch();

  return <PlanPageClient plans={plans} />;
}
