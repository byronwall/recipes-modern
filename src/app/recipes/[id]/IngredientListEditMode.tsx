"use client";
import { produce } from "immer";
import { useState } from "react";
import { useRecipeActions } from "~/app/useRecipeActions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { type IngredientListProps } from "./IngredientList";
import { Plus, Save } from "lucide-react";

type AddlProps = {
  cancelButton: React.ReactNode;
};

export function IngredientListEditMode({
  recipe,
  cancelButton,
}: IngredientListProps & AddlProps) {
  const [ingredientGroups, setIngredientGroups] = useState(
    recipe.ingredientGroups,
  );

  const { updateIngredientGroups } = useRecipeActions();

  type Ingredient = (typeof ingredientGroups)[0]["ingredients"][0];

  function handleIngredientChange<K extends keyof Ingredient>(
    ingredientGroupIdx: number,
    ingredientIdx: number,
    key: K,
    value: Ingredient[K],
  ) {
    setIngredientGroups(
      produce((draft) => {
        const group = draft[ingredientGroupIdx];

        if (!group) {
          return;
        }

        const ingredient = group.ingredients[ingredientIdx];

        if (!ingredient) {
          return;
        }

        ingredient[key] = value;
      }),
    );
  }

  function handleAddIngredient(ingredientGroupIdx: number) {
    setIngredientGroups(
      produce((draft) => {
        const newIngredient: Ingredient = {
          amount: "1",
          unit: "",
          ingredient: "New Ingredient",
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
      }),
    );
  }

  function handleDeleteIngredient(
    ingredientGroupIdx: number,
    ingredientIdx: number,
  ) {
    setIngredientGroups(
      produce((draft) => {
        const group = draft[ingredientGroupIdx];

        if (!group) {
          return;
        }

        // mark the ingredient as negative so we can delete it on save
        const ingredient = group.ingredients[ingredientIdx];

        if (!ingredient) {
          return;
        }

        ingredient.id = -ingredient.id;
      }),
    );
  }

  function handleTitleChange(ingredientGroupIdx: number, title: string) {
    setIngredientGroups(
      produce((draft) => {
        const group = draft[ingredientGroupIdx];

        if (!group) {
          return;
        }

        group.title = title;
      }),
    );
  }

  async function handleSave() {
    const shouldSave = confirm("Are you sure you want to save these changes?");

    if (!shouldSave) {
      return;
    }

    console.log("saving", ingredientGroups);

    await updateIngredientGroups.mutateAsync({
      recipeId: recipe.id,
      ingredientGroups,
    });
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <Button onClick={handleSave}>
          <Save />
          Save
        </Button>
        {cancelButton}
      </div>

      {ingredientGroups.map((igGroup, gIdx) => (
        <div key={gIdx}>
          <Input
            className="text-2xl"
            value={igGroup.title}
            onChange={(e) => handleTitleChange(gIdx, e.target.value)}
            placeholder="Group Title"
          />

          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Unit</th>
                <th>Ingredient</th>
                <th>Modifier</th>
                <th>Actions</th>
              </tr>
            </thead>
            {igGroup.ingredients.map((i, iIdx) => {
              const disableEdit = i.id < 0;
              const isNew = i.id === 0;

              return (
                <tr
                  key={iIdx}
                  className={cn({
                    "bg-red-200": disableEdit,
                    "bg-green-200": isNew,
                  })}
                >
                  <td>
                    <Input
                      value={i.amount}
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
                  <td>
                    <Input
                      value={i.unit}
                      onChange={(e) =>
                        handleIngredientChange(
                          gIdx,
                          iIdx,
                          "unit",
                          e.target.value,
                        )
                      }
                      disabled={disableEdit}
                    />
                  </td>
                  <td>
                    <Input
                      value={i.ingredient}
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
                  <td>
                    <Input
                      value={i.modifier}
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
                  <td>
                    <Button
                      onClick={() => handleDeleteIngredient(gIdx, iIdx)}
                      variant="destructive-outline"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </table>

          <Button onClick={() => handleAddIngredient(gIdx)} variant="secondary">
            <Plus />
            Add Ingredient to Group
          </Button>
        </div>
      ))}
    </div>
  );
}
