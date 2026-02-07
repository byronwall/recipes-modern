"use client";

import { produce } from "immer";
import { FolderPlus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Toggle } from "~/components/ui/toggle";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { cn } from "~/lib/utils";
import { type Recipe } from "./recipe-types";

type IngredientGroups = Recipe["ingredientGroups"];
type Ingredient = IngredientGroups[number]["ingredients"][number];

export function IngredientListEditMode(props: {
  ingredientGroups: IngredientGroups;
  originalIngredientGroups: IngredientGroups;
  onIngredientGroupsChange: (ingredientGroups: IngredientGroups) => void;
}) {
  const { ingredientGroups, originalIngredientGroups, onIngredientGroupsChange } =
    props;
  const hasAdvancedValues = ingredientGroups.some((group) =>
    group.ingredients.some((ingredient) => {
      if (ingredient.id < 0) {
        return false;
      }

      return [ingredient.amount, ingredient.unit, ingredient.modifier].some(
        (value) => value.trim().length > 0,
      );
    }),
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);
  const [pendingFocus, setPendingFocus] = useState<{
    groupIdx: number;
    ingredientIdx: number;
  } | null>(null);
  const ingredientInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );

  useEffect(() => {
    if (hasAdvancedValues) {
      setShowAdvanced(true);
    }
  }, [hasAdvancedValues]);

  const shouldShowAdvanced = hasAdvancedValues || showAdvanced;
  const canToggleAdvanced = !hasAdvancedValues;

  useEffect(() => {
    if (!pendingFocus) {
      return;
    }

    const key = `${pendingFocus.groupIdx}-${pendingFocus.ingredientIdx}-ingredient`;
    const target = ingredientInputRefs.current[key];

    if (target) {
      requestAnimationFrame(() => {
        target.focus();
        target.select();
      });
      setPendingFocus(null);
    }
  }, [ingredientGroups, pendingFocus]);

  function getOriginalGroup(group: IngredientGroups[number]) {
    if (group.id <= 0) {
      return undefined;
    }
    return originalIngredientGroups.find((original) => original.id === group.id);
  }

  function getOriginalIngredient(
    group: IngredientGroups[number],
    ingredient: Ingredient,
  ) {
    const originalGroup = getOriginalGroup(group);
    if (!originalGroup || ingredient.id <= 0) {
      return undefined;
    }
    return originalGroup.ingredients.find((original) => original.id === ingredient.id);
  }

  function dirtyClass(isDirty: boolean) {
    return cn(
      "transition-colors hover:bg-primary/10 focus-visible:bg-primary/10",
      isDirty && "border border-primary/30 shadow-[0_1px_0_0_hsl(var(--primary)/0.2)]",
    );
  }

  function setIngredientGroups(recipeUpdater: (draft: IngredientGroups) => void) {
    onIngredientGroupsChange(produce(ingredientGroups, recipeUpdater));
  }

  function handleIngredientChange<K extends keyof Ingredient>(
    ingredientGroupIdx: number,
    ingredientIdx: number,
    key: K,
    value: Ingredient[K],
  ) {
    setIngredientGroups((draft) => {
      const group = draft[ingredientGroupIdx];

      if (!group) {
        return;
      }

      const ingredient = group.ingredients[ingredientIdx];

      if (!ingredient) {
        return;
      }

      ingredient[key] = value;
    });
  }

  function handleAddIngredient(ingredientGroupIdx: number) {
    const nextIngredientIdx =
      ingredientGroups[ingredientGroupIdx]?.ingredients.length ?? 0;

    setIngredientGroups((draft) => {
      const newIngredient: Ingredient = {
        amount: "",
        unit: "",
        ingredient: "",
        modifier: "",
        aisle: "",
        comments: "",
        groupId: -1,
        id: 0,
        isGoodName: false,
        plu: "",
        rawInput: "",
      };

      const group = draft[ingredientGroupIdx];

      if (!group) {
        return;
      }

      group.ingredients.push(newIngredient);
    });
    setPendingFocus({
      groupIdx: ingredientGroupIdx,
      ingredientIdx: nextIngredientIdx,
    });
  }

  function handleDeleteIngredient(ingredientGroupIdx: number, ingredientIdx: number) {
    setIngredientGroups((draft) => {
      const group = draft[ingredientGroupIdx];

      if (!group) {
        return;
      }

      const ingredient = group.ingredients[ingredientIdx];

      if (!ingredient) {
        return;
      }

      if (ingredient.id === 0) {
        group.ingredients.splice(ingredientIdx, 1);
        return;
      }

      ingredient.id = -ingredient.id;
    });
  }

  function handleTitleChange(ingredientGroupIdx: number, title: string) {
    setIngredientGroups((draft) => {
      const group = draft[ingredientGroupIdx];

      if (!group) {
        return;
      }

      group.title = title;
    });
  }

  function handleAddGroup() {
    setIngredientGroups((draft) => {
      const recipeId = draft[0]?.recipeId ?? -1;
      draft.push({
        id: 0,
        title: "New group",
        order: draft.length,
        recipeId,
        ingredients: [
          {
            amount: "",
            unit: "",
            ingredient: "",
            modifier: "",
            aisle: "",
            comments: "",
            groupId: -1,
            id: 0,
            isGoodName: false,
            plu: "",
            rawInput: "",
          },
        ],
      });
    });
  }

  function handleDeleteGroup(groupIdx: number) {
    setIngredientGroups((draft) => {
      const activeGroupsCount = draft.filter((group) => group.id >= 0).length;
      if (activeGroupsCount <= 1) {
        return;
      }

      const group = draft[groupIdx];
      if (!group) {
        return;
      }

      if (group.id === 0) {
        draft.splice(groupIdx, 1);
        return;
      }

      group.id = -group.id;
    });
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-end">
        {canToggleAdvanced ? (
          <Toggle
            pressed={showAdvanced}
            onPressedChange={setShowAdvanced}
            variant="outline"
            size="sm"
            className="rounded-md"
            aria-label="Show advanced ingredient fields"
          >
            Show advanced
          </Toggle>
        ) : null}
      </div>

      {ingredientGroups.map((igGroup, gIdx) => {
        const isDeleted = igGroup.id < 0;
        const activeGroupsCount = ingredientGroups.filter(
          (group) => group.id >= 0,
        ).length;
        const originalGroup = getOriginalGroup(igGroup);
        const isTitleDirty =
          originalGroup?.title !== undefined
            ? igGroup.title !== originalGroup.title
            : igGroup.title !== "New group";
        const titleWidthCh = Math.max(8, igGroup.title.trim().length + 1);

        return (
          <div
            key={igGroup.id ?? gIdx}
            className={cn(
              "space-y-1.5 rounded-md bg-card/40",
              isDeleted && "bg-red-100/50",
            )}
          >
            <div className="flex items-center gap-2">
              <Input
                id={`ingredient-group-title-${igGroup.id ?? gIdx}`}
                className={cn(
                  "h-10 w-auto max-w-[calc(100%-2.5rem)] rounded-sm bg-background/80 text-xl font-semibold",
                  dirtyClass(isTitleDirty),
                )}
                style={{ width: `${titleWidthCh}ch` }}
                value={igGroup.title}
                onChange={(e) => handleTitleChange(gIdx, e.target.value)}
                placeholder="Group title"
              />
              <TooltipButton content="Delete ingredient group">
                <Button
                  onClick={() => handleDeleteGroup(gIdx)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                  disabled={activeGroupsCount <= 1 || isDeleted}
                >
                  <Trash2 className="size-4 shrink-0" />
                </Button>
              </TooltipButton>
            </div>

          <div className="ml-8 space-y-2">
          <table className="w-[calc(100%-1rem)] border-collapse">
            <thead>
              <tr className="border-b border-border/30 text-left text-sm font-semibold text-muted-foreground">
                {shouldShowAdvanced ? <th className="w-[12%] py-2 pr-3">Amount</th> : null}
                {shouldShowAdvanced ? <th className="w-[12%] py-2 pr-3">Unit</th> : null}
                <th
                  className={cn(
                    "py-2 pr-3",
                    shouldShowAdvanced ? "w-[60%]" : "w-[84%]",
                  )}
                >
                  Ingredient
                </th>
                {shouldShowAdvanced ? <th className="w-[16%] py-2 pr-3">Modifier</th> : null}
                <th className="w-[8%] py-2" />
              </tr>
            </thead>
            <tbody>
              {igGroup.ingredients.map((ingredient, iIdx) => {
                const disableEdit = ingredient.id < 0;
                const isNew = ingredient.id === 0;
                const originalIngredient = getOriginalIngredient(igGroup, ingredient);
                const isAmountDirty =
                  originalIngredient?.amount !== undefined
                    ? ingredient.amount !== originalIngredient.amount
                    : ingredient.amount !== "";
                const isUnitDirty =
                  originalIngredient?.unit !== undefined
                    ? ingredient.unit !== originalIngredient.unit
                    : ingredient.unit !== "";
                const isNameDirty =
                  originalIngredient?.ingredient !== undefined
                    ? ingredient.ingredient !== originalIngredient.ingredient
                    : ingredient.ingredient !== "";
                const isModifierDirty =
                  originalIngredient?.modifier !== undefined
                    ? ingredient.modifier !== originalIngredient.modifier
                    : ingredient.modifier !== "";

                return (
                  <tr
                    key={ingredient.id || `${gIdx}-${iIdx}`}
                    className={cn({
                      "bg-red-100/60": disableEdit,
                      "bg-emerald-100/20": isNew,
                    })}
                  >
                    {shouldShowAdvanced ? (
                      <td className="py-2 pr-3 align-top">
                        <Input
                          value={ingredient.amount}
                          className={cn(
                            "h-9 rounded-sm bg-background/70",
                            dirtyClass(isAmountDirty),
                          )}
                          onChange={(e) =>
                            handleIngredientChange(
                              gIdx,
                              iIdx,
                              "amount",
                              e.target.value,
                            )
                          }
                          disabled={disableEdit}
                        />
                      </td>
                    ) : null}
                    {shouldShowAdvanced ? (
                      <td className="py-2 pr-3 align-top">
                        <Input
                          value={ingredient.unit}
                          className={cn(
                            "h-9 rounded-sm bg-background/70",
                            dirtyClass(isUnitDirty),
                          )}
                          onChange={(e) =>
                            handleIngredientChange(gIdx, iIdx, "unit", e.target.value)
                          }
                          disabled={disableEdit}
                        />
                      </td>
                    ) : null}
                    <td className="py-2 pr-3 align-top">
                      <Input
                        ref={(node) => {
                          ingredientInputRefs.current[
                            `${gIdx}-${iIdx}-ingredient`
                          ] = node;
                        }}
                        value={ingredient.ingredient}
                        className={cn(
                          "h-9 rounded-sm bg-background/70",
                          dirtyClass(isNameDirty),
                        )}
                        onChange={(e) =>
                          handleIngredientChange(
                            gIdx,
                            iIdx,
                            "ingredient",
                            e.target.value,
                          )
                        }
                        disabled={disableEdit}
                      />
                    </td>
                    {shouldShowAdvanced ? (
                      <td className="py-2 pr-3 align-top">
                        <Input
                          value={ingredient.modifier}
                          className={cn(
                            "h-9 rounded-sm bg-background/70",
                            dirtyClass(isModifierDirty),
                          )}
                          onChange={(e) =>
                            handleIngredientChange(
                              gIdx,
                              iIdx,
                              "modifier",
                              e.target.value,
                            )
                          }
                          disabled={disableEdit}
                        />
                      </td>
                    ) : null}
                    <td className="py-2 align-top">
                      <TooltipButton content="Delete ingredient">
                        <Button
                          onClick={() => handleDeleteIngredient(gIdx, iIdx)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4 shrink-0" />
                        </Button>
                      </TooltipButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

            <Button
              onClick={() => handleAddIngredient(gIdx)}
              variant="secondary"
              className="ml-8 rounded-md"
            >
              <Plus className="shrink-0" />
              Add Ingredient to Group
            </Button>
          </div>
        );
      })}

      <Button onClick={handleAddGroup} className="rounded-md">
        <FolderPlus className="shrink-0" />
        Add Ingredient Group
      </Button>
    </div>
  );
}
