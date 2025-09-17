"use client";

import { H2 } from "~/components/ui/typography";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";
import { ShoppingRecipeItem } from "./ShoppingRecipeItem";
import { useState } from "react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useRadioList } from "./useRadioList";

export const groupModes = ["recipe", "aisle"] as const;

export function ShoppingList() {
  const { data: _shoppingList } = api.shoppingList.getShoppingList.useQuery();

  const shoppingList = _shoppingList ?? [];

  // group by recipe name + ID
  const recipesIncluded = shoppingList.filter((item) => item.Recipe);

  // create a Record of recipe ID to name
  const recipeNameById: Record<number, string> = {};
  for (const item of recipesIncluded) {
    if (item.Recipe) {
      recipeNameById[item.Recipe.id] = item.Recipe.name;
    }
  }

  const { groupMode, radioGroupComp } = useRadioList(groupModes, "recipe");

  const groupedShoppingList = shoppingList.reduce(
    (acc, item) => {
      if (groupMode === "recipe") {
        const key = item.Recipe
          ? recipeNameById[item.Recipe.id]!
          : "Loose Items";
        if (acc[key] === undefined) {
          acc[key] = [];
        }
        acc[key]!.push(item);
      } else if (groupMode === "aisle") {
        const aisleRaw = item.ingredient?.aisle;
        const key = aisleRaw ? aisleRaw.toLowerCase() : "Unknown Aisle";
        if (acc[key] === undefined) {
          acc[key] = [];
        }
        acc[key]!.push(item);
      }
      return acc;
    },
    {} as Record<string, typeof shoppingList>,
  );

  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  const groupedKeys = Object.keys(groupedShoppingList);
  groupedKeys.sort();

  const recipeNames = Object.entries(recipeNameById);

  // sort those names by the max of ingredient id
  recipeNames.sort((a, b) => {
    const aMax = shoppingList
      .filter((item) => item.Recipe?.id === +a[0])
      .reduce((acc, item) => Math.max(acc, item.id), 0);

    const bMax = shoppingList
      .filter((item) => item.Recipe?.id === +b[0])
      .reduce((acc, item) => Math.max(acc, item.id), 0);

    return aMax - bMax;
  });

  return (
    <>
      <H2>Recipes included</H2>
      <div className="flex flex-col gap-2">
        {recipeNames.map(([id, name]) => (
          <ShoppingRecipeItem key={id} id={id} name={name} />
        ))}
      </div>
      <div className="flex  items-center gap-4">
        <H2>Group Mode</H2>
        {radioGroupComp}
      </div>

      <div className="flex flex-col gap-6">
        {groupedKeys.map((key) => {
          const items = groupedShoppingList[key]!;
          const isVisible = !hiddenKeys.includes(key);

          return (
            <div key={key}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isVisible}
                  onCheckedChange={(_checked) =>
                    setHiddenKeys((keys) => {
                      if (keys.includes(key)) {
                        return keys.filter((k) => k !== key);
                      } else {
                        return [...keys, key];
                      }
                    })
                  }
                  id={`group-${key}`}
                />
                <Label
                  htmlFor={`group-${key}`}
                  className="cursor-pointer select-none"
                >
                  <H2>{key}</H2>
                </Label>
              </div>
              {isVisible ? (
                <div className="pl-8">
                  {items.map((item) => (
                    <ShoppingListCard
                      key={item.id}
                      item={item}
                      displayMode={groupMode === "recipe" ? "recipe" : "aisle"}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
