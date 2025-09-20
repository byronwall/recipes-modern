import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { env } from "~/env";
import type { GenerateRecipeRequest, GeneratedRecipe } from "~/types/ai";

const modelName = "gpt-4o-mini";

type EmitRecipeArgs = {
  name: string;
  description: string;
  cookMinutes?: number | null;
  type?: string | null;
  tags?: string[] | null;
  servings?: number | null;
  ingredientGroups: { title: string; ingredients: string[] }[];
  stepGroups: { title: string; steps: string[] }[];
};

export async function callOpenAI(
  req: GenerateRecipeRequest,
): Promise<EmitRecipeArgs> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const systemPrompt = [
    "You are a professional recipe developer and editor.",
    "Respect user constraints, but use good judgment: if a user suggestion will likely produce an unappealing, unsafe, or incoherent recipe, interpret it reasonably and improve it while honoring the spirit.",
    "When asked to generate multiple recipes in passes, ensure each pass differs meaningfully from the prior recipe(s). Prefer variety in cuisine, cooking method, primary protein, flavor profile, diet, or preparation technique.",
    "If you cannot achieve a clear difference, introduce variety anyway (e.g., change cuisine, spice profile, cooking technique, or format).",
    "Prefer concise, clear steps with home-cook-friendly units.",
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
    previousRecipes: req.previousRecipes ?? [],
    passIndex: req.passIndex ?? 1,
    totalPasses: req.totalPasses ?? 1,
    guidance: {
      goal: "Generate a recipe that is meaningfully different from the immediately previous recipe if provided.",
      differenceHints: [
        "Change cuisine/region",
        "Change primary protein or make vegetarian/vegan",
        "Change cooking method (stovetop, oven-roast, grill, pressure cook, slow cook)",
        "Change flavor profile (herb-forward, smoky, spicy, tangy, umami)",
        "Change format (soup, salad, bowl, wrap, bake, sheet pan, one-pot)",
      ],
      fallback:
        "If no obvious difference exists, add variety in any reasonable way while keeping constraints.",
    },
  };

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        "Generate a recipe. Consider previousRecipes (if any) and make this pass different. Payload: " +
        JSON.stringify(userPayload),
    },
  ];

  const chat: ChatCompletion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.7,
    messages,
    tools,
    tool_choice: "auto",
  });

  const toolCall = chat?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call returned from OpenAI");
  }
  const argsStr = toolCall.function?.arguments ?? "{}";
  const parsed: EmitRecipeArgs = JSON.parse(argsStr);
  return parsed;
}

export function parseAndValidate(json: unknown): {
  recipe: GeneratedRecipe;
  warnings: string[];
} {
  const warnings: string[] = [];
  const j: Record<string, unknown> = (json as Record<string, unknown>) ?? {};
  const recipe: GeneratedRecipe = {
    name: String((j as any)?.name ?? "Untitled Recipe").trim(),
    description: String((j as any)?.description ?? "").trim(),
    cookMinutes:
      typeof (j as any)?.cookMinutes === "number" && (j as any).cookMinutes >= 0
        ? ((j as any).cookMinutes as number)
        : undefined,
    type: ((): any => {
      const t = String((j as any)?.type ?? "OTHER").toUpperCase();
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
    tags: Array.isArray((j as any)?.tags)
      ? ((j as any).tags as unknown[])
          .filter((t: unknown): t is string => typeof t === "string")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    servings:
      typeof (j as any)?.servings === "number"
        ? ((j as any).servings as number)
        : undefined,
    ingredientGroups: Array.isArray((j as any)?.ingredientGroups)
      ? ((j as any).ingredientGroups as unknown[]).map(
          (g: unknown, idx: number) => {
            const gg = (g as Record<string, unknown>) ?? {};
            return {
              title: String(gg.title ?? `Ingredients ${idx + 1}`).trim(),
              ingredients: Array.isArray(gg.ingredients)
                ? (gg.ingredients as unknown[])
                    .map((s: unknown) => String((s as string) ?? "").trim())
                    .filter(Boolean)
                : [],
            };
          },
        )
      : [],
    stepGroups: Array.isArray((j as any)?.stepGroups)
      ? ((j as any).stepGroups as unknown[]).map((g: unknown, idx: number) => {
          const gg = (g as Record<string, unknown>) ?? {};
          return {
            title: String(gg.title ?? `Steps ${idx + 1}`).trim(),
            steps: Array.isArray(gg.steps)
              ? (gg.steps as unknown[])
                  .map((s: unknown) => String((s as string) ?? "").trim())
                  .filter(Boolean)
              : [],
          };
        })
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
