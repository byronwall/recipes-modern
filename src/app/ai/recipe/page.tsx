"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import type { GeneratedRecipe } from "~/types/ai";

export default function AiRecipePage() {
  const [prompt, setPrompt] = useState("");
  const [servings, setServings] = useState<number | "">("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type GenerateOut = { ok: true; recipe: GeneratedRecipe; warnings: string[] };
  const [result, setResult] = useState<GenerateOut | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const generateMutation = api.ai.generateRecipe.useMutation();

  const generatedRecipe = result?.recipe ?? null;

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const json = await generateMutation.mutateAsync({
        prompt,
        constraints: {
          servings: typeof servings === "number" ? servings : undefined,
          timeLimitMinutes:
            typeof timeLimit === "number" ? timeLimit : undefined,
        },
      });
      setResult(json as GenerateOut);
    } catch (e) {
      const err = e as { message?: string } | undefined;
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-2xl font-semibold">AI Recipe Generator</h1>
      <div className="space-y-2">
        <label className="text-sm font-medium">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Cozy fall soup with pumpkin and sage, 30 mins, 4 servings, vegetarian"
          rows={5}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Servings (optional)</label>
          <Input
            type="number"
            value={servings}
            onChange={(e) => {
              const v = e.target.value;
              setServings(v === "" ? "" : Number(v));
            }}
            min={1}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Time limit minutes (optional)
          </label>
          <Input
            type="number"
            value={timeLimit}
            onChange={(e) => {
              const v = e.target.value;
              setTimeLimit(v === "" ? "" : Number(v));
            }}
            min={1}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={loading || !prompt.trim()} onClick={onGenerate}>
          {loading ? "Generating..." : "Generate"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {generatedRecipe && (
        <div className="space-y-3 rounded-md border p-4">
          <div>
            <h2 className="text-xl font-semibold">{generatedRecipe.name}</h2>
            {generatedRecipe.cookMinutes != null && (
              <p className="text-sm text-muted-foreground">
                Cook time: {generatedRecipe.cookMinutes} min
              </p>
            )}
            {generatedRecipe.description && (
              <p className="mt-2">{generatedRecipe.description}</p>
            )}
          </div>
          {!!generatedRecipe.tags?.length && (
            <div className="text-sm text-muted-foreground">
              Tags: {generatedRecipe.tags?.join(", ")}
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-medium">Ingredients</h3>
              <div className="mt-2 space-y-2">
                {generatedRecipe.ingredientGroups.map((g, gi) => (
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
                {generatedRecipe.stepGroups.map((g, gi) => (
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
      )}
    </div>
  );
}
