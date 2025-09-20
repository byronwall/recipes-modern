import OpenAI from "openai";
import { env } from "~/env";
import type { GenerateRecipeRequest, GeneratedRecipe } from "~/types/ai";

const modelName = "gpt-4o-mini";

export async function callOpenAI(req: GenerateRecipeRequest): Promise<any> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const systemPrompt = [
    "You are a professional recipe developer and editor.",
    "Respect user constraints. Prefer concise, clear steps with home-cook-friendly units.",
    "Output via the emit_recipe tool only.",
  ].join(" ");

  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "emit_recipe",
        description: "Emit a structured recipe that conforms to the schema.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            cookMinutes: { type: ["integer", "null"], minimum: 0 },
            type: {
              type: ["string", "null"],
              enum: [
                "BREAKFAST",
                "LUNCH",
                "DINNER",
                "DESSERT",
                "SNACK",
                "DRINK",
                "OTHER",
                null,
              ],
            },
            tags: {
              type: ["array", "null"],
              items: { type: "string" },
            },
            servings: { type: ["integer", "null"], minimum: 1 },
            ingredientGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["title", "ingredients"],
                additionalProperties: false,
              },
              minItems: 1,
            },
            stepGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  steps: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 1,
                  },
                },
                required: ["title", "steps"],
                additionalProperties: false,
              },
              minItems: 1,
            },
          },
          required: ["name", "description", "ingredientGroups", "stepGroups"],
          additionalProperties: false,
        },
      },
    },
  ];

  const userPayload = {
    prompt: req.prompt,
    constraints: req.constraints ?? {},
    regenerateScope: req.regenerateScope ?? "all",
  };

  const chat = await client.chat.completions.create({
    model: modelName,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify(userPayload),
      },
    ],
    tools,
    tool_choice: "auto",
  });

  const toolCall = (chat as any)?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call returned from OpenAI");
  }
  const args = toolCall.function?.arguments ?? "{}";
  return JSON.parse(args);
}

export function parseAndValidate(json: any): {
  recipe: GeneratedRecipe;
  warnings: string[];
} {
  const warnings: string[] = [];
  const recipe: GeneratedRecipe = {
    name: String(json?.name ?? "Untitled Recipe").trim(),
    description: String(json?.description ?? "").trim(),
    cookMinutes:
      typeof json?.cookMinutes === "number" && json.cookMinutes >= 0
        ? json.cookMinutes
        : undefined,
    type: ((): any => {
      const t = String(json?.type ?? "OTHER").toUpperCase();
      const allowed = [
        "BREAKFAST",
        "LUNCH",
        "DINNER",
        "DESSERT",
        "SNACK",
        "DRINK",
        "OTHER",
      ];
      return allowed.includes(t) ? (t as any) : "OTHER";
    })(),
    tags: Array.isArray(json?.tags)
      ? json.tags
          .filter((t: unknown) => typeof t === "string")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    servings: typeof json?.servings === "number" ? json.servings : undefined,
    ingredientGroups: Array.isArray(json?.ingredientGroups)
      ? json.ingredientGroups.map((g: any, idx: number) => ({
          title: String(g?.title ?? `Ingredients ${idx + 1}`).trim(),
          ingredients: Array.isArray(g?.ingredients)
            ? g.ingredients
                .map((s: any) => String(s ?? "").trim())
                .filter(Boolean)
            : [],
        }))
      : [],
    stepGroups: Array.isArray(json?.stepGroups)
      ? json.stepGroups.map((g: any, idx: number) => ({
          title: String(g?.title ?? `Steps ${idx + 1}`).trim(),
          steps: Array.isArray(g?.steps)
            ? g.steps.map((s: any) => String(s ?? "").trim()).filter(Boolean)
            : [],
        }))
      : [],
  };

  if (recipe.ingredientGroups.length === 0) {
    warnings.push(
      "No ingredient groups produced; added an empty default group.",
    );
    recipe.ingredientGroups = [{ title: "Ingredients", ingredients: [] }];
  }
  if (recipe.stepGroups.length === 0) {
    warnings.push("No step groups produced; added an empty default group.");
    recipe.stepGroups = [{ title: "Steps", steps: [] }];
  }

  return { recipe, warnings };
}
