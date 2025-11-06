import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
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

const modelName = "gpt-4o-mini";

export async function callOpenAITouchUp(
  req: TouchUpRequest,
): Promise<TouchUpResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const systemPrompt = [
    "You are an expert recipe editor.",
    "Improve clarity and structure while preserving the original intent and quantities.",
    "Output ONLY via the emit_touchup tool.",
  ].join(" ");

  const tools: any[] = [
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
  ];

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

  const chat: ChatCompletion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.3,
    messages,
    tools,
    tool_choice: "auto",
  });

  const toolCall = chat?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call returned from OpenAI");
  }
  const argsStr = toolCall.function?.arguments ?? "{}";
  const parsed: TouchUpResult = JSON.parse(argsStr);
  return parsed;
}
