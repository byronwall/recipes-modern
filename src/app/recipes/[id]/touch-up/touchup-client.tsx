"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { H4 } from "~/components/ui/typography";
import Link from "next/link";
import { ChevronLeft, Sparkles } from "lucide-react";
import { PageHeader } from "~/components/layout/PageHeader";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

function IngredientPieces(props: {
  amount?: string | null;
  modifier?: string | null;
  unit?: string | null;
  ingredient: string;
}) {
  const { amount, modifier, unit, ingredient } = props;
  const hasAmount = Boolean(amount && amount.trim().length > 0);
  const hasModifier = Boolean(modifier && modifier.trim().length > 0);
  const hasUnit = Boolean(unit && unit.trim().length > 0);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {hasAmount ? (
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800">
          {amount}
        </span>
      ) : null}
      {hasUnit ? (
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
          {unit}
        </span>
      ) : null}
      <span>{ingredient}</span>
      {hasModifier ? (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
          {modifier}
        </span>
      ) : null}
    </span>
  );
}

function IngredientsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800">
        Amount
      </span>
      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
        Modifier
      </span>
      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
        Unit
      </span>
    </div>
  );
}

export function TouchUpClient(props: { id: number }) {
  const { id } = props;
  const router = useRouter();

  const { data: recipe } = api.recipe.getRecipe.useQuery({ id });

  const utils = api.useUtils();
  const touchUpMutation = api.ai.touchUpRecipe.useMutation();
  const replaceGroups = api.recipe.replaceGroups.useMutation({
    onSuccess: async () => {
      await utils.recipe.getRecipe.invalidate({ id });
    },
  });

  const [prompt, setPrompt] = useState<string>(
    "Clarify steps, split multi-action steps, and group logically. Parse ingredients into amount, modifier, unit, ingredient. Preserve original intent and quantities.",
  );

  const result = touchUpMutation.data?.result;

  const left = useMemo(() => {
    if (!recipe) return null;
    return (
      <div className="space-y-4">
        <div>
          <H4 className="mb-1 text-sm">Ingredients</H4>
          <div className="space-y-2">
            {recipe.ingredientGroups
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((g, gi, arr) => {
                const hasTitle = Boolean(g.title && g.title.trim().length > 0);
                const displayTitle = hasTitle
                  ? g.title
                  : arr.length === 1
                    ? "Main Ingredients"
                    : `Group ${gi + 1}`;
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="font-medium">{displayTitle}</div>
                    <ul className="list-disc pl-5 text-sm">
                      {g.ingredients.map((ing) => (
                        <li key={ing.id}>
                          <IngredientPieces
                            amount={ing.amount}
                            modifier={ing.modifier}
                            unit={ing.unit}
                            ingredient={ing.ingredient}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </div>

        <div>
          <H4 className="mb-1 text-sm">Steps</H4>
          <div className="space-y-2">
            {recipe.stepGroups
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="font-medium">{g.title}</div>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    {g.steps.map((s, i) => (
                      <li key={`${g.id}-${i}`}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }, [recipe]);

  const right = useMemo(() => {
    if (!result) return null;
    const expandNote = (note: string): string => {
      if (/No stepGroups in result/i.test(note)) {
        return `${note} — The AI tool output did not include any step groups, so we could not use AI-generated steps.`;
      }
      if (/Step group \d+ has no steps/i.test(note)) {
        return `${note} — One of the groups ended up with zero steps after AI processing.`;
      }
      if (/contains blank steps/i.test(note)) {
        return `${note} — Some steps were empty strings, likely due to over-splitting or parsing issues.`;
      }
      if (/No result parsed/i.test(note)) {
        return `${note} — The AI function arguments could not be parsed; the tool call may have been malformed.`;
      }
      return note;
    };
    return (
      <div className="space-y-4">
        <div>
          <H4 className="mb-1 text-sm">Ingredients (proposed)</H4>
          <div className="space-y-4">
            {(result.ingredientGroups ?? []).map((g, gi) => (
              <div key={gi} className="space-y-2">
                <div className="font-medium">{g.title}</div>
                <ul className="list-disc pl-5 text-sm">
                  {(g.ingredients ?? []).map((ing, ii) => (
                    <li key={ii}>
                      <IngredientPieces
                        amount={ing.amount}
                        modifier={ing.modifier}
                        unit={ing.unit}
                        ingredient={ing.ingredient}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <H4 className="mb-1 text-sm">Steps (proposed)</H4>
          <div className="space-y-2">
            {(result.stepGroups ?? []).map((g, gi) => (
              <div key={gi} className="space-y-1">
                <div className="font-medium">{g.title}</div>
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  {g.steps.map((s, si) => (
                    <li key={`${gi}-${si}`}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {Array.isArray(result.notes) && result.notes.length > 0 ? (
          <div>
            <H4 className="mb-1 text-sm">Notes</H4>
            <ul className="list-disc pl-5 text-sm">
              {result.notes.map((n, i) => (
                <li key={i}>{expandNote(n)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }, [result]);

  const handleRun = async () => {
    await touchUpMutation.mutateAsync({ recipeId: id, prompt });
  };

  const handleAccept = async () => {
    if (!result) return;
    await replaceGroups.mutateAsync({
      recipeId: id,
      ingredientGroups: (result.ingredientGroups ?? []).map((g) => ({
        title: g.title,
        ingredients: (g.ingredients ?? []).map((ing) => ({
          ingredient: ing.ingredient,
          amount: ing.amount,
          modifier: ing.modifier,
          unit: ing.unit,
          original: ing.original,
        })),
      })),
      stepGroups: (result.stepGroups ?? []).map((g) => ({
        title: g.title,
        steps: g.steps,
      })),
    });
    router.push(`/recipes/${id}`);
  };

  const handleReject = () => {
    router.push(`/recipes/${id}`);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-3">
        <Link
          href={`/recipes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:no-underline"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          {recipe?.name ?? "Back to recipe"}
        </Link>
        <PageHeader
          title="Touch up with AI"
          description="Clean up ingredient parsing and step structure, then review before saving."
        />
      </div>

      <section className="space-y-3 rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-5">
        <Label htmlFor="ai-guidance" className="text-sm font-medium">
          Guidance
        </Label>
        <Textarea
          id="ai-guidance"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleRun} isLoading={touchUpMutation.isPending}>
            {!touchUpMutation.isPending && (
              <Sparkles className="h-4 w-4 shrink-0" />
            )}
            <span className="ml-1">
              {result ? "Run again" : "Run touch up"}
            </span>
          </Button>
          {touchUpMutation.error ? (
            <p role="alert" className="text-sm text-destructive">
              {touchUpMutation.error.message}
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="min-w-0 rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current
          </h2>
          {left}
        </section>
        <section
          className={cn(
            "flex min-w-0 flex-col rounded-2xl border p-4 shadow-sm sm:p-5",
            result ? "border-primary/40 bg-primary/5" : "bg-card/70",
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proposed
            </h2>
            {result ? <IngredientsLegend /> : null}
          </div>
          {right ?? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              {touchUpMutation.isPending ? (
                <p>Working on it…</p>
              ) : (
                <>
                  <p className="font-medium text-foreground">No proposal yet</p>
                  <p>Run touch up to see a suggested version here.</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {result ? (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            Review the proposal, then save it to the recipe.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleReject}>
              Discard
            </Button>
            <Button onClick={handleAccept} isLoading={replaceGroups.isPending}>
              Accept changes
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
