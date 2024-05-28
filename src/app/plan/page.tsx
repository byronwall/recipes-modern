import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { PlanPageClient } from "./PlanPageClient";

export default async function PlanPage() {
  await useEnforceAuth();

  await (await helpers()).recipe.getMealPlans.prefetch();

  return <PlanPageClient />;
}
