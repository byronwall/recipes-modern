"use client";

import { PopoverContent } from "@radix-ui/react-popover";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverTrigger } from "~/components/ui/popover";
import { H4 } from "~/components/ui/typography";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { useMealPlanActions } from "../useMealPlanActions";
import { Trash } from "lucide-react";

export function PlanCard(props: { plan: PlannedMealWithRecipe }) {
  const { plan } = props;

  const { handleDelete } = useMealPlanActions();

  const updatePlan = api.mealPlan.updateMealPlan.useMutation();

  const shortMonth = new Date(plan.date).toLocaleDateString("en-US", {
    month: "short",
  });

  return (
    <div
      className={cn("w-[276px] rounded border border-gray-200 p-2", {
        "bg-gray-200 text-gray-700": plan.isMade,
      })}
    >
      <div className="flex gap-4 ">
        <Popover>
          <PopoverTrigger className="">
            <div className="flex  flex-1 flex-col items-center justify-center  ">
              <div className="text-2xl font-bold">{shortMonth}</div>
              <div className="text-4xl font-bold">
                {new Date(plan.date).getDate()}
              </div>
              <div className="text-xs font-bold text-gray-500">
                {new Date(plan.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="z-10 border border-black bg-white">
            <Calendar
              mode="single"
              selected={plan.date}
              title="Select date"
              onSelect={(date) => {
                updatePlan.mutate({
                  id: plan.id,
                  date,
                });
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex flex-col gap-1">
          <Link href={`/recipes/${plan.Recipe.id}`}>
            <H4>{plan.Recipe.name}</H4>
          </Link>
          <div>{plan.isMade ? "made" : "not made"}</div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleDelete(plan.id)}
              variant="destructive-outline"
            >
              <Trash size={16} />
              Delete
            </Button>
            <Button
              onClick={() => {
                updatePlan.mutate({
                  id: plan.id,
                  isMade: !plan.isMade,
                });
              }}
              disabled={updatePlan.isPending}
            >
              {plan.isMade ? "Not made" : "Made"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
type PlannedMealWithRecipe = RouterOutputs["recipe"]["getMealPlans"][0];
