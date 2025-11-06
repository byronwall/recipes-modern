"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { H3, H4 } from "~/components/ui/typography";
import { api } from "~/trpc/react";

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
          <H4>Ingredients</H4>
          <div className="space-y-2">
            {recipe.ingredientGroups
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="font-medium">{g.title}</div>
                  <ul className="list-disc pl-5 text-sm">
                    {g.ingredients.map((ing) => {
                      const composed = [
                        ing.amount,
                        ing.modifier,
                        ing.unit,
                        ing.ingredient,
                      ]
                        .filter((p) =>
                          Boolean(p && String(p).trim().length > 0),
                        )
                        .join(" ")
                        .replace(/\s+/g, " ")
                        .trim();
                      const display =
                        ing.rawInput && ing.rawInput.trim().length > 0
                          ? ing.rawInput
                          : composed || ing.ingredient;
                      return <li key={ing.id}>{display}</li>;
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        <div>
          <H4>Steps</H4>
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
    return (
      <div className="space-y-4">
        <div>
          <H4>Ingredients (proposed)</H4>
          <div className="space-y-4">
            {(result.ingredientGroups ?? []).map((g, gi) => (
              <div key={gi} className="space-y-2">
                <div className="font-medium">{g.title}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Modifier</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Original</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(g.ingredients ?? []).map((ing, ii) => (
                      <TableRow key={ii}>
                        <TableCell className="whitespace-nowrap">
                          {ing.amount}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ing.modifier}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {ing.unit}
                        </TableCell>
                        <TableCell>{ing.ingredient}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ing.original}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </div>

        <div>
          <H4>Steps (proposed)</H4>
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
      </div>
    );
  }, [result]);

  const canAccept = Boolean(result);

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
    <div className="space-y-4">
      <H3>Touch up with AI</H3>

      <div className="space-y-2">
        <Label htmlFor="ai-guidance">Guidance (optional)</Label>
        <Textarea
          id="ai-guidance"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <div className="flex gap-2">
          <Button onClick={handleRun} isLoading={touchUpMutation.isPending}>
            Run touch up
          </Button>
          <Button
            variant="outline"
            onClick={() => touchUpMutation.reset()}
            disabled={!result}
          >
            Clear result
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <H3>Original</H3>
          {left}
        </div>
        <div>
          <H3>Proposed</H3>
          {right}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAccept}
          disabled={!canAccept}
          isLoading={replaceGroups.isPending}
        >
          Accept changes
        </Button>
        <Button
          variant="secondary"
          onClick={handleRun}
          isLoading={touchUpMutation.isPending}
        >
          Prompt to a new edit
        </Button>
        <Button variant="outline" onClick={handleReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
