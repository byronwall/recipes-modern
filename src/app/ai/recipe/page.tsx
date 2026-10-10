"use client";

import { Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import type { GeneratedRecipe } from "~/types/ai";
import { useAiRecipesStore } from "~/hooks/use-ai-recipes-store";
import type { RecipeType as PrismaRecipeType } from "@prisma/client";

export default function AiRecipePage() {
  const [error, setError] = useState<string | null>(null);
  type GenerateManyOut = {
    ok: true;
    results: { recipe: GeneratedRecipe; warnings: string[] }[];
  };

  const {
    prompt,
    setPrompt,
    servings,
    setServings,
    timeLimitMinutes,
    setTimeLimitMinutes,
    count,
    setCount,
    results,
    setResults,
    clearResults,
    selectedIndices,
    selectToggle,
    selectAll,
  } = useAiRecipesStore();

  const selectedSet = useMemo(
    () => new Set(selectedIndices),
    [selectedIndices],
  );

  const generateManyMutation = api.ai.generateRecipes.useMutation();
  const saveMutation = api.recipe.createRecipeFromTextInput.useMutation();

  const allSelected = useMemo(() => {
    return results.length > 0 && selectedIndices.length === results.length;
  }, [results.length, selectedIndices]);

  async function onGenerate() {
    setError(null);
    clearResults();
    try {
      const json = (await generateManyMutation.mutateAsync({
        prompt,
        constraints: {
          servings: servings,
          timeLimitMinutes: timeLimitMinutes,
        },
        count: count ?? 3,
      })) as GenerateManyOut;
      setResults(json.results ?? []);
    } catch (e) {
      const err = e as { message?: string } | undefined;
      setError(err?.message ?? "Request failed");
    }
  }

  function toggleSelect(idx: number) {
    selectToggle(idx);
  }

  function selectAllLocal(flag: boolean) {
    selectAll(flag);
  }

  function toImporterText(recipe: GeneratedRecipe): {
    ingredients: string;
    steps: string;
  } {
    const ingredientsText = recipe.ingredientGroups
      .map((g) =>
        [
          `[${g.title || "Ingredients"}]`,
          ...g.ingredients.map((line) => `- ${line}`),
        ].join("\n"),
      )
      .join("\n\n");
    const stepsText = recipe.stepGroups
      .map((g) =>
        [
          `[${g.title || "Steps"}]`,
          ...g.steps.map((line, i) => `${i + 1}. ${line}`),
        ].join("\n"),
      )
      .join("\n\n");
    return { ingredients: ingredientsText, steps: stepsText };
  }

  async function onSaveOne(idx: number) {
    const item = results[idx];
    if (!item) return;
    const { recipe } = item;
    const { ingredients, steps } = toImporterText(recipe);
    await saveMutation.mutateAsync({
      title: recipe.name,
      description: recipe.description,
      ingredients,
      steps,
      type: recipe.type as PrismaRecipeType | undefined,
      cookMinutes: recipe.cookMinutes,
    });
  }

  async function onSaveSelected() {
    const indices = Array.from(selectedSet.values()).sort((a, b) => a - b);
    for (const idx of indices) {
      // eslint-disable-next-line no-await-in-loop
      await onSaveOne(idx);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        title="Generate recipes"
        description="Describe what you're in the mood for and get a few drafts to save."
      />
      <section className="space-y-4 rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-5">
        <div className="space-y-2">
          <label htmlFor="ai-prompt" className="text-sm font-medium">
            What should we make?
          </label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Cozy fall soup with pumpkin and sage, 30 mins, 4 servings, vegetarian"
            rows={5}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="ai-servings" className="text-sm font-medium">
              Servings{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="ai-servings"
              type="number"
              value={servings ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setServings(v === "" ? undefined : Number(v));
              }}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ai-time" className="text-sm font-medium">
              Max minutes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="ai-time"
              type="number"
              value={timeLimitMinutes ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setTimeLimitMinutes(v === "" ? undefined : Number(v));
              }}
              min={1}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ai-count" className="text-sm font-medium">
              Number of ideas
            </label>
            <Input
              id="ai-count"
              type="number"
              value={count}
              onChange={(e) => {
                const v = e.target.value;
                setCount(v === "" ? 3 : Number(v));
              }}
              min={1}
              max={8}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={generateManyMutation.isPending || !prompt.trim()}
            onClick={onGenerate}
          >
            {generateManyMutation.isPending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0" />
            )}
            <span className="ml-1">
              {generateManyMutation.isPending ? "Generating…" : "Generate"}
            </span>
          </Button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </section>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Generated {results.length} recipe{results.length === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={allSelected}
                  onChange={(e) => selectAllLocal(e.target.checked)}
                />
                Select all
              </label>
              <Button
                variant="secondary"
                disabled={
                  selectedIndices.length === 0 || saveMutation.isPending
                }
                onClick={onSaveSelected}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : `Save selected (${selectedIndices.length})`}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {results.map(({ recipe, warnings }, idx) => (
              <div
                key={idx}
                className="rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{recipe.name}</h2>
                    {recipe.cookMinutes != null && (
                      <p className="text-sm text-muted-foreground">
                        Cook time: {recipe.cookMinutes} min
                      </p>
                    )}
                    {recipe.description && (
                      <p className="mt-2">{recipe.description}</p>
                    )}
                    {!!recipe.tags?.length && (
                      <div className="text-sm text-muted-foreground">
                        Tags: {recipe.tags?.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedSet.has(idx)}
                        onChange={() => toggleSelect(idx)}
                      />
                      Select
                    </label>
                    <Button
                      size="sm"
                      onClick={() => onSaveOne(idx)}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                {warnings?.length ? (
                  <div className="mt-2 text-sm text-amber-700">
                    Warnings: {warnings.join("; ")}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium">Ingredients</h3>
                    <div className="mt-2 space-y-2">
                      {recipe.ingredientGroups.map((g, gi) => (
                        <div key={gi} className="space-y-1">
                          <div className="font-medium">{g.title}</div>
                          <ul className="list-disc pl-5 text-sm">
                            {g.ingredients.map((line, li) => (
                              <li key={li}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Steps</h3>
                    <div className="mt-2 space-y-2">
                      {recipe.stepGroups.map((g, gi) => (
                        <div key={gi} className="space-y-1">
                          <div className="font-medium">{g.title}</div>
                          <ol className="list-decimal space-y-1 pl-5 text-sm">
                            {g.steps.map((line, li) => (
                              <li key={li}>{line}</li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
