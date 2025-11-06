import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { env } from "~/env";

export type TouchUpIngredient = {
  original: string;
  amount: string;
  modifier: string;
  unit: string;
  ingredient: string;
};

export type TouchUpGroup<T> = {
  title: string;
  items: T[];
};

export type TouchUpResult = {
  ingredientGroups: Array<{
    title: string;
    ingredients: TouchUpIngredient[];
  }>;
  stepGroups: Array<{
    title: string;
    steps: string[];
  }>;
  notes?: string[];
};

type TouchUpRequest = {
  prompt?: string;
  current: {
    name: string;
    description?: string | null;
    ingredientGroups: Array<{ title: string; ingredients: string[] }>;
    stepGroups: Array<{ title: string; steps: string[] }>;
  };
};

const modelName = "gpt-5";

export async function callOpenAITouchUp(
  req: TouchUpRequest,
): Promise<TouchUpResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const summarizeArrayCounts = (
    arr: Array<{ title: string; steps: string[] }>,
  ) => {
    const totalSteps = arr.reduce((sum, g) => sum + (g?.steps?.length || 0), 0);
    return { groups: arr.length, totalSteps };
  };

  const summarizeIngredientCounts = (
    arr: Array<{ title: string; ingredients: string[] }>,
  ) => {
    const totalIngredients = arr.reduce(
      (sum, g) => sum + (g?.ingredients?.length || 0),
      0,
    );
    return { groups: arr.length, totalIngredients };
  };

  const systemPrompt = [
    "You are an expert recipe editor.",
    "Improve clarity and structure while preserving the original intent and quantities.",
    "Output ONLY via the emit_touchup tool.",
  ].join(" ");

  const tools = [
    {
      type: "function",
      function: {
        name: "emit_touchup",
        description:
          "Emit a cleaned-up version of the recipe: clearer step groups and parsed ingredients.",
        parameters: {
          type: "object",
          properties: {
            ingredientGroups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string" },
                        amount: { type: "string" },
                        modifier: { type: "string" },
                        unit: { type: "string" },
                        ingredient: { type: "string" },
                      },
                      required: [
                        "original",
                        "amount",
                        "modifier",
                        "unit",
                        "ingredient",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "ingredients"],
                additionalProperties: false,
              },
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
            },
            notes: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["ingredientGroups", "stepGroups"],
          additionalProperties: false,
        },
      },
    },
  ] as unknown as ChatCompletionTool[];

  const defaultGuidance = [
    "Clean up and clarify steps. Split long, multi-action steps into smaller steps.",
    "Group steps logically with short titles if helpful.",
    "Parse ingredients into amount, modifier, unit, and ingredient name. Preserve meaning.",
    "Keep the same quantities unless obviously inconsistent.",
    "A 'group' is a section heading for a set of steps (e.g., 'Soup Base', 'Toppings').",
    "If there is only one group or the original has no titles, use the group title 'All Steps'.",
    "If multiple groups have missing titles, use concise inferred titles or 'Group N'.",
    "Do NOT drop steps or groups. If no improvement is needed, copy the original steps verbatim.",
    "Every output step group must contain at least one step.",
    "If you cannot confidently parse steps, return the original steps and explain why in notes.",
  ].join(" ");

  const userPayload = {
    guidance:
      req.prompt && req.prompt.trim().length > 0 ? req.prompt : defaultGuidance,
    current: req.current,
  };

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        "Improve this recipe's clarity and structure. Return the result via emit_touchup. Payload: " +
        JSON.stringify(userPayload),
    },
  ];

  // Basic request diagnostics (lengths and counts only)
  try {
    const stepSummary = summarizeArrayCounts(req.current.stepGroups);
    const ingSummary = summarizeIngredientCounts(req.current.ingredientGroups);
    // eslint-disable-next-line no-console
    console.log("[aiTouchUp] request", {
      model: modelName,
      guidanceLength: (userPayload.guidance || "").length,
      stepGroups: stepSummary.groups,
      totalSteps: stepSummary.totalSteps,
      ingredientGroups: ingSummary.groups,
      totalIngredients: ingSummary.totalIngredients,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[aiTouchUp] failed to summarize request", e);
  }

  const chat: ChatCompletion = await client.chat.completions.create({
    model: modelName,
    temperature: 1,
    messages,
    tools,
    tool_choice: "auto",
  });

  const toolCall = chat?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    // eslint-disable-next-line no-console
    console.error("[aiTouchUp] No tool call returned from OpenAI", {
      rawMessage: chat?.choices?.[0]?.message,
    });
    throw new Error("No tool call returned from OpenAI");
  }
  const argsStr = toolCall.function?.arguments ?? "{}";
  // eslint-disable-next-line no-console
  console.log("[aiTouchUp] tool args size", { length: argsStr.length });

  let parsed: TouchUpResult | undefined;
  try {
    parsed = JSON.parse(argsStr) as unknown as TouchUpResult;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[aiTouchUp] Failed to parse tool args", e);
  }

  const validate = (res: TouchUpResult | undefined) => {
    const errors: string[] = [];
    if (!res) {
      errors.push("No result parsed");
      return { ok: false, errors };
    }
    if (!Array.isArray(res.stepGroups) || res.stepGroups.length === 0) {
      errors.push("No stepGroups in result");
    } else {
      res.stepGroups.forEach((g, idx) => {
        if (!Array.isArray(g.steps) || g.steps.length === 0) {
          errors.push(`Step group ${idx + 1} has no steps`);
        }
        const blanks = (g.steps || []).filter(
          (s) => !s || String(s).trim().length === 0,
        );
        if (blanks.length > 0) {
          errors.push(`Step group ${idx + 1} contains blank steps`);
        }
      });
    }
    return { ok: errors.length === 0, errors };
  };

  const { ok, errors } = validate(parsed);
  if (ok && parsed) {
    return parsed;
  }

  // eslint-disable-next-line no-console
  console.warn("[aiTouchUp] Invalid AI touch-up result. Falling back.", {
    errors,
  });

  // Fallback: keep AI ingredients if available; always keep original steps
  const fallbackIngredients = (req.current.ingredientGroups || []).map((g) => ({
    title: g.title,
    ingredients: (g.ingredients || []).map((original) => ({
      original,
      amount: "",
      modifier: "",
      unit: "",
      ingredient: original,
    })),
  }));

  const fallbackSteps = (req.current.stepGroups || []).map((g) => ({
    title: g.title,
    steps: g.steps || [],
  }));

  const result: TouchUpResult = {
    ingredientGroups: parsed?.ingredientGroups?.length
      ? parsed.ingredientGroups
      : fallbackIngredients,
    stepGroups: fallbackSteps,
    notes: [
      "AI returned an invalid result for steps. Original steps were preserved.",
      ...(errors || []),
    ],
  };
  return result;
}
