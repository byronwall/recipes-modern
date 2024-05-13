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
  const { data: shoppingList = [] } =
    api.shoppingList.getShoppingList.useQuery();

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
      if (groupMode === "recipe" && item.Recipe) {
        const recipeName = recipeNameById[item.Recipe.id]!;
        if (acc[recipeName] === undefined) {
          acc[recipeName] = [];
        }
        acc[recipeName]!.push(item);
      } else if (groupMode === "aisle") {
        const aisle = item.ingredient?.aisle || "Unknown Aisle";
        if (acc[aisle] === undefined) {
          acc[aisle] = [];
        }
        acc[aisle]!.push(item);
      }
      return acc;
    },
    {} as Record<string, typeof shoppingList>,
  );

  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);

  const groupedKeys = Object.keys(groupedShoppingList);
  groupedKeys.sort();

  return (
    <>
      <H2>Recipes included</H2>
      <div>
        {Object.entries(recipeNameById).map(([id, name]) => (
          <ShoppingRecipeItem key={id} id={id} name={name} />
        ))}
      </div>
      <H2>Group Mode</H2>
      {radioGroupComp}

      <H2>Grouped List</H2>
      <div>
        {groupedKeys.map((key) => {
          const items = groupedShoppingList[key]!;
          const isVisible = !hiddenKeys.includes(key);

          return (
            <div key={key}>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isVisible}
                  onCheckedChange={(checked) =>
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
                <div>
                  {items.map((item) => (
                    <ShoppingListCard key={item.id} item={item} />
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
