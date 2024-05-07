import { H1 } from "~/components/ui/typography";
import { useData } from "../recipes/[id]/useData";

export default async function PlanPage() {
  const { allData, recipesById } = await useData();

  const plans = allData.plannedMeals;

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

      <ul>
        {plansThisMonth.map((plan) => (
          <li key={plan.id}>
            {plan.recipeId}
            {recipesById[plan.recipeId]?.name}
            {plan.date}
            {plan.isMade ? "made" : "not made"}
          </li>
        ))}
      </ul>

      {/* show 7 boxes, for current week */}
      {/* for each box, show a dropdown of recipes, and a date picker */}
    </div>
  );
}
