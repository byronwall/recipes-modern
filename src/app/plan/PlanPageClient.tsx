"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  addDays,
  endOfDay,
  format,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShoppingBasket,
  Trash,
} from "lucide-react";

import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { H1 } from "~/components/ui/typography";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import { AddToMealPlanPopover } from "../AddToMealPlanPopover";
import { useMealPlanActions } from "../useMealPlanActions";
import { useRecipeActions } from "../useRecipeActions";
import { RecipePickerPopover } from "./RecipePickerPopover";

type PlannedMealWithRecipe = RouterOutputs["recipe"]["getMealPlans"][0];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toPlanDate(value: Date | string): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function MealPlanRow(props: {
  plan: PlannedMealWithRecipe;
  onDelete: (id: number) => void;
  onToggleMade: (plan: PlannedMealWithRecipe) => void;
  onAddToList: (id: number) => Promise<unknown>;
  onReschedule: (plan: PlannedMealWithRecipe, date: Date) => Promise<unknown>;
  isMutating: boolean;
}) {
  const { plan, onDelete, onToggleMade, onAddToList, onReschedule, isMutating } =
    props;
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isMovePopoverOpen, setIsMovePopoverOpen] = useState(false);

  return (
    <HoverCard
      openDelay={70}
      closeDelay={120}
      open={isHoverOpen || isMovePopoverOpen}
      onOpenChange={setIsHoverOpen}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full truncate px-0 py-0.5 text-left text-sm font-medium transition-colors hover:text-foreground/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            plan.isMade && "text-muted-foreground",
          )}
        >
          {plan.Recipe.name}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="right"
        className="w-72 overflow-visible p-0"
      >
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <Link
              href={`/recipes/${plan.Recipe.id}`}
              className="line-clamp-2 text-base font-semibold leading-tight hover:underline"
            >
              {plan.Recipe.name}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">{plan.Recipe.type}</span>
              {plan.isMade && <span className="rounded-full bg-muted px-2 py-0.5">made</span>}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <TooltipButton content="Delete meal">
                <Button
                  onClick={() => onDelete(plan.id)}
                  variant="destructive-outline"
                  size="icon"
                  aria-label="Delete meal"
                >
                  <Trash className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipButton>

              <TooltipButton
                content={plan.isOnShoppingList ? "Already on list" : "Add to list"}
              >
                <Button
                  onClick={() => {
                    void onAddToList(plan.id);
                  }}
                  disabled={isMutating || plan.isOnShoppingList}
                  size="icon"
                  variant="outline"
                  aria-label="Add to list"
                >
                  <ShoppingBasket className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipButton>

              <Popover open={isMovePopoverOpen} onOpenChange={setIsMovePopoverOpen}>
                <PopoverTrigger asChild>
                  <span className="inline-flex">
                    <TooltipButton content="Move to another day">
                      <Button
                        disabled={isMutating}
                        size="icon"
                        variant="outline"
                        aria-label="Move meal to another day"
                      >
                        <CalendarDays className="h-4 w-4 shrink-0" />
                      </Button>
                    </TooltipButton>
                  </span>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" className="w-auto p-2">
                  <Calendar
                    mode="single"
                    selected={toPlanDate(plan.date) ?? undefined}
                    onSelect={async (date) => {
                      if (!date) return;
                      await onReschedule(plan, startOfDay(date));
                      setIsMovePopoverOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={() => onToggleMade(plan)}
              disabled={isMutating}
              size="sm"
              className="h-8"
            >
              {plan.isMade ? "Not made" : "Made"}
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function PlanPageClient() {
  const [shouldHideCompleted, setShouldHideCompleted] = useState(true);
  const [calendarStart, setCalendarStart] = useState(() =>
    startOfWeek(startOfDay(new Date()), { weekStartsOn: 0 }),
  );
  const calendarEnd = endOfDay(addDays(calendarStart, 20));

  const { data } = api.recipe.getMealPlans.useQuery();

  const { handleDelete } = useMealPlanActions();
  const { handleAddToMealPlan, addMealPlanToList } = useRecipeActions();
  const updatePlan = api.mealPlan.updateMealPlan.useMutation();

  const calendarDays = useMemo(
    () => Array.from({ length: 21 }, (_, index) => addDays(calendarStart, index)),
    [calendarStart],
  );

  const visiblePlans = useMemo(() => {
    return (data ?? [])
      .filter((plan) => {
        const planDate = toPlanDate(plan.date);
        if (!planDate) return false;
        return planDate >= calendarStart && planDate <= calendarEnd;
      })
      .filter((plan) => (!shouldHideCompleted ? true : !plan.isMade))
      .sort((a, b) => {
        const aDate = toPlanDate(a.date);
        const bDate = toPlanDate(b.date);
        if (!aDate || !bDate) return 0;
        return aDate.getTime() - bDate.getTime();
      });
  }, [calendarEnd, calendarStart, data, shouldHideCompleted]);

  const popularDishes = useMemo(() => {
    const counts = new Map<
      number,
      { recipeId: number; name: string; type: string; madeCount: number }
    >();

    for (const plan of data ?? []) {
      if (!plan.isMade) continue;
      const existing = counts.get(plan.Recipe.id);
      if (existing) {
        existing.madeCount += 1;
        continue;
      }
      counts.set(plan.Recipe.id, {
        recipeId: plan.Recipe.id,
        name: plan.Recipe.name,
        type: plan.Recipe.type,
        madeCount: 1,
      });
    }

    return Array.from(counts.values())
      .sort((a, b) => b.madeCount - a.madeCount || a.name.localeCompare(b.name))
      .slice(0, 10);
  }, [data]);

  const recentlyMade = useMemo(() => {
    return (data ?? [])
      .filter((plan) => plan.isMade)
      .sort((a, b) => {
        const aDate = toPlanDate(a.date);
        const bDate = toPlanDate(b.date);
        if (!aDate || !bDate) return 0;
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5);
  }, [data]);

  const plansByDay = useMemo(() => {
    const map = new Map<string, PlannedMealWithRecipe[]>();

    for (const plan of visiblePlans) {
      const planDate = toPlanDate(plan.date);
      if (!planDate) continue;
      const key = format(startOfDay(planDate), "yyyy-MM-dd");
      const current = map.get(key);
      if (!current) {
        map.set(key, [plan]);
        continue;
      }
      current.push(plan);
    }

    return map;
  }, [visiblePlans]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeaderCard className="border-0 bg-transparent p-0 shadow-none">
        <div className="flex flex-col gap-3">
          <H1 className="leading-tight">Planned Meals</H1>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={shouldHideCompleted}
                onCheckedChange={setShouldHideCompleted}
                id="hide-completed"
              />
              <Label htmlFor="hide-completed" className="cursor-pointer text-sm">
                Hide made meals
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <TooltipButton content="Previous week">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous week"
                  onClick={() => setCalendarStart((current) => addDays(current, -7))}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipButton>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCalendarStart(startOfWeek(startOfDay(new Date()), { weekStartsOn: 0 }))
                }
              >
                Today
              </Button>

              <TooltipButton content="Next week">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next week"
                  onClick={() => setCalendarStart((current) => addDays(current, 7))}
                >
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipButton>
            </div>
          </div>
        </div>
      </PageHeaderCard>

      <div className="hidden gap-2 md:grid md:grid-cols-7">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {calendarDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayPlans = plansByDay.get(dayKey) ?? [];
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dayKey}
              className={cn(
                "flex min-h-[170px] flex-col gap-2 rounded-2xl border bg-card/70 p-3 shadow-sm",
                isCurrentDay && "border-primary/70 bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold leading-none">
                    {format(day, "d")}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {format(day, "MMM")}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:hidden">
                    {format(day, "EEE")}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                {dayPlans.map((plan) => (
                  <MealPlanRow
                    key={plan.id}
                    plan={plan}
                    onDelete={handleDelete}
                    onToggleMade={(selectedPlan) => {
                      updatePlan.mutate({
                        id: selectedPlan.id,
                        isMade: !selectedPlan.isMade,
                      });
                    }}
                    onAddToList={(id) => addMealPlanToList.mutateAsync({ id })}
                    onReschedule={(selectedPlan, date) =>
                      updatePlan.mutateAsync({
                        id: selectedPlan.id,
                        date,
                      })
                    }
                    isMutating={updatePlan.isPending || addMealPlanToList.isPending}
                  />
                ))}
              </div>

              <div className="mt-auto flex justify-center pt-1">
                <RecipePickerPopover
                  iconOnly
                  onRecipeSelected={async (recipeId) => {
                    await handleAddToMealPlan(recipeId, startOfDay(day));
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Popular Dishes</h2>
          <span className="text-xs text-muted-foreground">Top 10 by times made</span>
        </div>
        {popularDishes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No made meals yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {popularDishes.map((dish, index) => (
              <div
                key={dish.recipeId}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/80 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/recipes/${dish.recipeId}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {index + 1}. {dish.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{dish.type}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                      {dish.madeCount}x
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AddToMealPlanPopover recipeId={dish.recipeId} display="icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Recently Made</h2>
          <span className="text-xs text-muted-foreground">Last 5 made meals</span>
        </div>
        {recentlyMade.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing marked made yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyMade.map((plan) => {
              const planDate = toPlanDate(plan.date);
              return (
                  <Link
                    key={plan.id}
                    href={`/recipes/${plan.Recipe.id}`}
                    className="flex min-h-[120px] flex-col gap-2 rounded-xl border bg-background/80 p-3 transition-colors hover:bg-background"
                  >
                    <div className="line-clamp-2 text-sm font-semibold leading-tight">
                      {plan.Recipe.name}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{plan.Recipe.type}</span>
                      <span>
                        {planDate ? format(planDate, "MMM d, yyyy") : "Unknown date"}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
