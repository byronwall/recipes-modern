"use client";

import { formatMoney } from "~/app/list/formatMoney";
import { cn } from "~/lib/utils";
import { type RouterOutputs } from "~/trpc/react";
import { PurchaseQuickAddButton } from "./PurchaseQuickAddButton";
import Link from "next/link";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { buttonVariants } from "~/components/ui/button";
import { Search } from "lucide-react";

type RecentPurchase =
  RouterOutputs["purchases"]["recentByIngredientIds"]["ingredientPurchases"][number]["purchases"][number];

type Props = {
  purchases: RecentPurchase[];
  currentRecipeId?: number | null;
  ingredientId?: number;
  listItemId?: number;
  className?: string;
  emptyLabel?: string;
  compact?: boolean;
  hideEmpty?: boolean;
};

function formatPurchaseDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IngredientPurchaseHistory(props: Props) {
  const {
    purchases,
    currentRecipeId,
    ingredientId,
    listItemId,
    className,
    emptyLabel = "No recent purchases",
    compact = false,
    hideEmpty = false,
  } = props;

  if (!purchases.length) {
    if (hideEmpty) return null;
    return <p className={cn("text-xs text-muted-foreground", className)}>{emptyLabel}</p>;
  }

  const sameRecipe = purchases.filter((purchase) => {
    if (!currentRecipeId) return true;
    return purchase.linkedRecipe?.id === currentRecipeId;
  });

  const differentRecipe = purchases.filter((purchase) => {
    if (!currentRecipeId) return false;
    return purchase.linkedRecipe?.id !== currentRecipeId;
  });

  const groups: Array<{ key: string; label: string; items: RecentPurchase[] }> = [
    { key: "same", label: "Same recipe", items: sameRecipe },
    { key: "other", label: "Different recipe", items: differentRecipe },
  ].filter((group) => group.items.length > 0);

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {groups.flatMap((group) =>
          group.items.map((purchase) => {
            const recipeIdForQuickAdd =
              typeof purchase.linkedRecipe?.id === "number"
                ? purchase.linkedRecipe.id
                : currentRecipeId ?? undefined;

            return (
              <HoverCard key={purchase.id} openDelay={80} closeDelay={120}>
                <HoverCardTrigger
                  className="overflow-hidden rounded-md border border-border/60 bg-background/60 transition hover:border-border hover:shadow-sm"
                  aria-label={`View purchase details for ${purchase.krogerName}`}
                >
                  <img
                    src={purchase.imageUrl}
                    alt={purchase.krogerName}
                    className="h-8 w-8 object-cover"
                  />
                </HoverCardTrigger>
                <HoverCardContent
                  align="start"
                  side="top"
                  className="w-72 rounded-2xl border bg-card p-3 shadow-xl"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={purchase.imageUrl}
                      alt={purchase.krogerName}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold">
                        {purchase.krogerName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatPurchaseDate(purchase.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-accent/60 px-2 py-0.5">
                      {formatMoney(purchase.price)}
                    </span>
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
                      Qty {purchase.quantity}
                    </span>
                    {purchase.linkedRecipe ? (
                      <span className="rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
                        {purchase.linkedRecipe.name}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <PurchaseQuickAddButton
                        purchase={purchase}
                        ingredientId={ingredientId ?? purchase.ingredientId ?? undefined}
                        recipeId={recipeIdForQuickAdd}
                        listItemId={listItemId}
                      />
                      <Link
                        href={`https://www.kroger.com/search?query=${encodeURIComponent(
                          purchase.krogerName,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 gap-1.5 text-xs",
                        )}
                      >
                        <Search className="h-3.5 w-3.5 shrink-0" />
                        Search Kroger
                      </Link>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          }),
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {groups.map((group) => (
        <div key={group.key} className="space-y-1.5">
          {currentRecipeId ? (
            <p className="text-[11px] uppercase text-muted-foreground">{group.label}</p>
          ) : null}
          <div className="space-y-1.5">
            {group.items.map((purchase) => {
              const recipeIdForQuickAdd =
                typeof purchase.linkedRecipe?.id === "number"
                  ? purchase.linkedRecipe.id
                  : currentRecipeId ?? undefined;

              return (
                <div
                  key={purchase.id}
                  className="rounded-xl border bg-background/80 px-2.5 py-2"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <img
                      src={purchase.imageUrl}
                      alt={purchase.krogerName}
                      className="h-9 w-9 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {purchase.krogerName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="rounded-full bg-accent/60 px-2 py-0.5">
                          {formatMoney(purchase.price)}
                        </span>
                        <span className="rounded-full bg-background px-2 py-0.5 text-muted-foreground">
                          Qty {purchase.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          {formatPurchaseDate(purchase.createdAt)}
                        </span>
                        {purchase.linkedRecipe ? (
                          <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px]">
                            {purchase.linkedRecipe.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <PurchaseQuickAddButton
                      purchase={purchase}
                      ingredientId={ingredientId ?? purchase.ingredientId ?? undefined}
                      recipeId={recipeIdForQuickAdd}
                      listItemId={listItemId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
