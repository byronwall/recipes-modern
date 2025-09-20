# Product Requirements Document — “Prompt → Recipe”

> **One-liner:** Users type a cooking idea in natural language; the system generates a complete, editable recipe (title, description, ingredient groups, step groups, tags, cook time) that can be saved to your existing `Recipe`/`IngredientGroup`/`StepGroup` models.

---

## 1) Goals & Non-Goals

- **Goals**

  - Convert a user prompt (e.g., “cozy fall soup with pumpkin + sage, 30 mins, serves 4”) into a production-ready recipe.
  - Minimize friction: fast first draft, then tight refine → preview → save flow.
  - Ensure output conforms to your **text import** (ingredient list + step list; supports groups).
  - Provide affordances to **constrain** generation (time, servings, diet) and iteratively refine.
  - Save one click to **Shopping List** / **Meal Plan** after create.

- **Non-Goals**

  - Full nutrition calculation (can be a follow-on).
  - Full price optimization & Kroger substitutions (separate feature).
  - Media generation (photos/videos) v1.

---

## 2) Primary Personas

- **Home cook / Parent**: wants quick, reliable recipes from vague ideas.
- **Power user**: wants constraints (diet, tools, time), grouping, and fast iteration.
- **Admin/Owner (you)**: needs clean data conformance, easy moderation/rollback, clear logs.

---

## 3) Success Metrics

- **Activation:** % of users who generate **and** save a recipe (target ≥40%).
- **Iteration:** Average refinements per session (target 1–2).
- **Time to first draft:** P50 < 5s (model/config dependent).
- **Data quality:** ≥95% parsable ingredient lines; ≥1 step group with ≥3 steps.

---

## 4) Feature List (with UX affordances)

- **A. Prompt Box + Constraints Chips**

  - Free-form textarea for the idea.
  - Optional chips/inputs: _Servings_, _Time limit_, _Diet/Allergy_, _Cuisine_, _Tools_, _Skill level_, _Spice level_.
  - **UX affordances**

    - Placeholder examples (“e.g., ‘cozy fall soup with pumpkin and sage, 30 mins, 4 servings’”).
    - Keyboard submit (Enter) + “Generate” button.
    - “Advanced constraints” popover for additional options.

- **B. First Draft Generation (Server-side)**

  - Calls OpenAI with **structured output** (JSON) aligned to your schema.
  - Guarantees: at least one `IngredientGroup` (“Main”) and one `StepGroup` (“Steps”).
  - Maps to your **text import** pathway (ingredient lines + step lines per group).

- **C. Live Preview (Editable)**

  - Two tabs:

    - **Form View** (title, description, groups with draggable items).
    - **Text View** (raw import text blocks per group; shows exactly what importer will ingest).

  - **Affordances**

    - Inline edit for group titles, ingredient lines, step lines.
    - “+ Add group”, “Split group”, “Merge groups”.
    - “Regenerate Section” (ingredients only, steps only, or whole).

- **D. Iterative Refinement (Chat-style)**

  - Small input under preview: “Make it dairy-free”, “halve the sugar”.
  - Applies as **delta prompt** to regenerate minimal sections; preserves edits unless user opts to replace.
  - Undo last change.

- **E. Validation & Guardrails**

  - Static checks: non-empty title; ≥1 group; ≥1 step; ingredients parseable (>90% lines).
  - Warnings: unknown units/modifiers, suspicious times (e.g., 5 min roast).
  - Quick-fix actions: normalize units (“tsp” → “teaspoon”), expand ranges (“1–2” → “2, note”).

- **F. Save Flow**

  - One click **Save** → creates `Recipe`, `IngredientGroup[]`, `Ingredient[]`, `StepGroup[]`, optional `tags`, `cookMinutes`, `type`.
  - Optional post-save modals:

    - “Add to Shopping List?”
    - “Plan a date?” (creates `PlannedMeal` with scale).

  - Toast with link to the created recipe.

- **G. History & Attribution**

  - Store the original prompt + model/version + constraints + hash in an **audit log** (see Data below).
  - UI: “View generation details” (for you/admin).

- **H. Error & Retry**

  - Friendly error card with the raw text fallback if JSON parse fails.
  - “Retry with stricter format” button; “Open as text” to manual fix.

---

## 5) End-to-End Flow (User Journey)

1. User opens **Create → AI Recipe**.
2. Types idea + selects constraints → **Generate**.
3. Sees **Preview** (Form + Text tabs).
4. Edits or refines specific parts (ingredients only, steps only).
5. **Validate** (warnings shown inline).
6. **Save** → recipe persisted; optional add to Shopping List/PlannedMeal.
7. Post-save CTA: “Try a variation” (spicier, vegan, budget).

---

## 6) Data & Schema Mapping

- **No required schema changes** for v1. Use:

  - `Recipe`: `name`, `description`, `cookMinutes`, `type`, `userId`.
  - `IngredientGroup` (ordered): `title`, `order`, `recipeId`.
  - `Ingredient`: `rawInput` (full original line), and parsed fields `ingredient`, `amount`, `unit`, `modifier`, plus optional `comments`, `aisle`, etc.
  - `StepGroup`: `title`, `order`, `steps` (ordered `String[]`).
  - `Tag` + `RecipeTag` for auto-tagging (optional).

- **Recommended (optional) new table for provenance**
  _If you want explicit auditability; otherwise store in `Recipe.description` as a footer block._

  - `AIGeneration` (separate):

    - `id, recipeId, userId, model, temperature, prompt, constraintsJson, outputJson, createdAt`.

  - Minimal addition; not strictly required.

---

## 7) Interfaces Between Bits (Contracts)

### 7.1 Client → Server (Generate)

- **Endpoint:** `POST /api/ai/generate-recipe`
- **Request (JSON)**

  ```json
  {
    "prompt": "cozy fall soup with pumpkin and sage, 30 mins, 4 servings",
    "constraints": {
      "servings": 4,
      "timeLimitMinutes": 30,
      "diet": ["vegetarian"],
      "allergies": [],
      "cuisine": "American",
      "tools": ["dutch_oven"],
      "skill": "intermediate",
      "spiceLevel": "mild"
    },
    "regenerateScope": "all" // "ingredients" | "steps" | "all"
  }
  ```

- **Response (JSON)**

  ```json
  {
    "ok": true,
    "recipe": {
      "name": "Creamy Pumpkin & Sage Soup",
      "description": "A cozy fall soup that balances sweet pumpkin with aromatic sage...",
      "cookMinutes": 30,
      "type": "DINNER",
      "tags": ["fall", "soup", "vegetarian", "30-minute"],
      "servings": 4,
      "ingredientGroups": [
        {
          "title": "Main",
          "ingredients": [
            "2 tbsp olive oil",
            "1 small onion, diced",
            "2 cloves garlic, minced",
            "2 cups pumpkin purée",
            "3 cups vegetable broth",
            "1/2 cup cream (or milk)",
            "6 fresh sage leaves, finely chopped",
            "Salt and black pepper to taste"
          ]
        },
        {
          "title": "Garnish (optional)",
          "ingredients": [
            "Toasted pumpkin seeds",
            "Drizzle of olive oil",
            "Crispy sage leaves"
          ]
        }
      ],
      "stepGroups": [
        {
          "title": "Soup",
          "steps": [
            "Warm olive oil in a dutch oven over medium heat. Sauté onion 3–4 minutes until translucent.",
            "Add garlic, cook 30 seconds.",
            "Stir in pumpkin purée and broth; bring to a simmer.",
            "Add chopped sage and simmer 10 minutes.",
            "Reduce heat; stir in cream. Season with salt and pepper.",
            "Blend for a smoother texture if desired. Serve hot with garnishes."
          ]
        }
      ]
    },
    "warnings": []
  }
  ```

### 7.2 Server → OpenAI (Structured Output)

- **Model:** `gpt-4o-mini` / `gpt-4.1` class, with **JSON mode** or tool-calling.
- **System Prompt (sketch)**

  > You are a professional recipe developer. Output strictly as JSON matching the schema. Use common US home-cook units. Respect constraints. Prefer ≤ 12 ingredients and ≤ 10 steps unless requested.

- **JSON Schema (tool)**

  ```json
  {
    "name": "emit_recipe",
    "description": "Emit a complete, structured recipe.",
    "parameters": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "cookMinutes": { "type": "integer" },
        "type": {
          "type": "string",
          "enum": [
            "BREAKFAST",
            "LUNCH",
            "DINNER",
            "DESSERT",
            "SNACK",
            "DRINK",
            "OTHER"
          ]
        },
        "tags": { "type": "array", "items": { "type": "string" } },
        "servings": { "type": "integer" },
        "ingredientGroups": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "ingredients": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["title", "ingredients"]
          }
        },
        "stepGroups": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "steps": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["title", "steps"]
          }
        }
      },
      "required": ["name", "description", "ingredientGroups", "stepGroups"]
    }
  }
  ```

### 7.3 Server → Importer (Your existing text import)

- **For each IngredientGroup** send a `string[]` of raw lines (already provided in response).
- **For each StepGroup** send a `string[]` of step lines.
- **Mapping Pseudocode**

  > If groups are missing, create default “Main”/“Steps”.
  > If cook minutes missing, estimate from step durations or omit.
  > If type missing, default to `OTHER` and backfill later via tags.

---

## 8) Algorithms & Validation

- **Normalization**

  - Units: tbsp/tsp/cup/oz → canonical; pluralize based on amount.
  - Amount formats: “1–2” → keep raw; set `comments` with guidance.
  - Modifiers: chopped/minced/room temp → `modifier`.
  - Store entire original line in `Ingredient.rawInput`.

- **Parsing**

  - Regex & heuristics per line → {amount, unit, ingredient, modifier, comments}
  - If parse fails, keep `rawInput` and set `isGoodName=false`.

- **Guardrails**

  - Ingredient count 3–24; steps 3–15; group titles non-empty.
  - **Hard fail** if stepGroups empty or all ingredient lines unparseable.
  - **Soft warn** on exotic units or impossible times (e.g., 5-min braise).

---

## 9) UI / UX Details

- **Entry Page**

  - Big prompt box, chips line beneath, “Generate” CTA.
  - Secondary “Examples” dropdown (chips auto-populate).

- **Preview**

  - **Left:** Form View (editable fields).
  - **Right:** Text View mirrors what importer will ingest.
  - Side rail shows Warnings with quick-fix buttons.

- **Refinement**

  - Mini prompt: “less dairy”, “spicier”, “swap chicken → shrimp”.
  - Scope toggle: {Ingredients | Steps | All}.
  - “Apply” regenerates target section; “Compare” side-by-side diff; “Keep Mine” or “Use AI”.

- **Saving**

  - Primary “Save Recipe”.
  - Post-save modals: “Add to Shopping List?” / “Plan a date?”
  - Toast: “Saved — View Recipe”.

---

## 10) Example TS Types & Handlers (server)

```ts
// types.ts
export interface GenerateRecipeRequest {
  prompt: string;
  constraints?: {
    servings?: number;
    timeLimitMinutes?: number;
    diet?: string[];
    allergies?: string[];
    cuisine?: string;
    tools?: string[];
    skill?: "beginner" | "intermediate" | "expert";
    spiceLevel?: "mild" | "medium" | "hot";
  };
  regenerateScope?: "ingredients" | "steps" | "all";
}

export interface GeneratedRecipe {
  name: string;
  description: string;
  cookMinutes?: number;
  type?:
    | "BREAKFAST"
    | "LUNCH"
    | "DINNER"
    | "DESSERT"
    | "SNACK"
    | "DRINK"
    | "OTHER";
  tags?: string[];
  servings?: number;
  ingredientGroups: { title: string; ingredients: string[] }[];
  stepGroups: { title: string; steps: string[] }[];
}

export interface GenerateRecipeResponse {
  ok: boolean;
  recipe?: GeneratedRecipe;
  warnings?: string[];
  error?: string;
}
```

```ts
// api/ai/generate-recipe.ts (Next.js route handler)
import { NextRequest, NextResponse } from "next/server";
import type { GenerateRecipeRequest, GenerateRecipeResponse } from "@/types";
import {
  callOpenAI,
  parseAndValidate,
  toImporterPayload,
} from "@/lib/ai-recipe";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateRecipeRequest;
  if (!body?.prompt?.trim()) {
    return NextResponse.json<GenerateRecipeResponse>(
      { ok: false, error: "Missing prompt" },
      { status: 400 },
    );
  }

  try {
    const aiJson = await callOpenAI(body); // calls tool-enabled JSON output
    const { recipe, warnings } = parseAndValidate(aiJson); // normalize + guardrails
    const importerPayload = toImporterPayload(recipe); // groups of text lines

    // Optionally: return importerPayload too for client preview of exact text-import
    return NextResponse.json<GenerateRecipeResponse>({
      ok: true,
      recipe,
      warnings: warnings ?? [],
    });
  } catch (err) {
    console.error("[generate-recipe] error:", err);
    return NextResponse.json<GenerateRecipeResponse>(
      { ok: false, error: "Generation failed" },
      { status: 500 },
    );
  }
}
```

```ts
// lib/ai-recipe.ts (core)
// Note: add console logs for debug as requested
import OpenAI from "openai";
import type { GenerateRecipeRequest, GeneratedRecipe } from "@/types";

export async function callOpenAI(req: GenerateRecipeRequest): Promise<any> {
  console.log("[callOpenAI] prompt:", req.prompt); // debug
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const sys = [
    "You are a professional recipe developer.",
    "Respect user constraints. Use home-cook-friendly steps and units.",
    "Output via the 'emit_recipe' tool only.",
  ].join(" ");

  // Tool (function) schema omitted here for brevity; pass as tools: [...]
  const chat = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: sys },
      {
        role: "user",
        content: JSON.stringify({
          prompt: req.prompt,
          constraints: req.constraints,
          regenerateScope: req.regenerateScope,
        }),
      },
    ],
    tools: [
      /* emit_recipe tool schema */
    ],
    tool_choice: "auto",
  });

  const tool = chat.choices?.[0]?.message?.tool_calls?.[0];
  if (!tool) throw new Error("No tool call returned");
  console.log("[callOpenAI] tool name:", tool.function?.name); // debug
  return JSON.parse(tool.function.arguments ?? "{}");
}

export function parseAndValidate(json: any): {
  recipe: GeneratedRecipe;
  warnings: string[];
} {
  // Basic schema validation / defaults
  const warnings: string[] = [];
  if (!json.name) json.name = "Untitled Recipe";
  if (!json.ingredientGroups?.length) {
    json.ingredientGroups = [{ title: "Main", ingredients: [] }];
    warnings.push("Ingredients were empty; created default 'Main' group.");
  }
  if (!json.stepGroups?.length) {
    json.stepGroups = [{ title: "Steps", steps: [] }];
    warnings.push("Steps were empty; created default 'Steps' group.");
  }
  // Clamp group sizes, trim whitespace, etc.
  json.ingredientGroups = json.ingredientGroups.map((g) => ({
    title: (g.title ?? "Main").trim(),
    ingredients: (g.ingredients ?? [])
      .map((s: string) => s.trim())
      .filter(Boolean),
  }));
  json.stepGroups = json.stepGroups.map((g) => ({
    title: (g.title ?? "Steps").trim(),
    steps: (g.steps ?? []).map((s: string) => s.trim()).filter(Boolean),
  }));
  console.log(
    "[parseAndValidate] groups:",
    json.ingredientGroups.length,
    json.stepGroups.length,
  ); // debug

  const recipe: GeneratedRecipe = json;
  return { recipe, warnings };
}

export function toImporterPayload(recipe: GeneratedRecipe) {
  // If your text importer expects blocks, return exactly the lines grouped
  return {
    name: recipe.name,
    description: recipe.description,
    groups: recipe.ingredientGroups.map((g) => ({
      title: g.title,
      lines: g.ingredients,
    })),
    steps: recipe.stepGroups.map((g) => ({ title: g.title, lines: g.steps })),
  };
}
```

---

## 11) Persistence (Server → DB)

- **Service function**

  ```ts
  // saveRecipe.ts
  import { prisma } from "@/lib/prisma";
  import type { GeneratedRecipe } from "@/types";

  export async function saveGeneratedRecipe(
    userId: string,
    r: GeneratedRecipe,
  ) {
    console.log("[saveGeneratedRecipe] saving:", r.name); // debug
    return prisma.recipe.create({
      data: {
        name: r.name,
        description: r.description ?? "",
        cookMinutes: r.cookMinutes ?? null,
        type: (r.type as any) ?? "OTHER",
        userId,
        ingredientGroups: {
          create: r.ingredientGroups.map((g, i) => ({
            title: g.title || `Group ${i + 1}`,
            order: i,
            ingredients: {
              create: g.ingredients.map((line) => ({
                rawInput: line,
                // parsed fields can be filled by your importer/parser
                ingredient: "",
                amount: "",
                unit: "",
                modifier: "",
              })),
            },
          })),
        },
        stepGroups: {
          create: r.stepGroups.map((g, i) => ({
            title: g.title || `Steps ${i + 1}`,
            order: i,
            steps: g.steps,
          })),
        },
        ...(r.tags?.length
          ? {
              tags: {
                create: r.tags.map((slugOrName) => ({
                  tag: {
                    connectOrCreate: {
                      where: { slug: slugify(slugOrName) },
                      create: {
                        slug: slugify(slugOrName),
                        name: titleCase(slugOrName),
                      },
                    },
                  },
                })),
              },
            }
          : {}),
      },
    });
  }
  ```

  > You can replace the inline ingredient `create` with your **existing importer** if you prefer full parsing before insert.

---

## 12) Edge Cases & Error Handling

- **Model returns prose not JSON** → retry with JSON-strict system message; fallback to Text View for manual fix.
- **No ingredients or steps** → add default group, show warning, ask for refinement.
- **Allergy/diet conflict** → refuse ingredient (e.g., dairy in vegan), show conflict chip with “Resolve” (swap).
- **Timeouts** → show spinner → “Try again with simpler prompt” CTA.
- **Rate limits** → per-user daily cap; show remaining quota.

---

## 13) Security, Privacy, Abuse

- Sanitize and log prompts server-side only (never expose API key to client).
- Content filter: block unsafe prompts (alcohol for minors, etc. as applicable to your audience).
- PII: do not store user messages beyond audit fields unless necessary; redact emails/addresses if pasted.

---

## 14) Observability

- **Logs:** request id, user id, latency buckets, token usage, success/fail reason.
- **Events:** `ai.generate.started`, `ai.generate.succeeded`, `ai.generate.failed`, `ai.refine.applied`, `recipe.saved`.
- **Metrics:** p50/p95 generation time, JSON parse failure rate, warning counts per recipe.

---

## 15) Performance & Cost Controls

- Use a **small, fast model** for draft + a **guardrail post-processor**; or a single JSON-capable model with temperature 0.6–0.8.
- **Stop sequences** to limit rambling; **max tokens** caps; reuse **system prompt** across requests.
- Client-side debounce; **caching**: same prompt+constraints hash → return cached result.

---

## 16) Rollout Plan

- **Alpha:** internal only; log every output; triage parse issues; build red-flag rules.
- **Beta:** enable for signed-in users; cap per-day generations; collect thumbs-up/down + free-text feedback.
- **GA:** add CTA from recipe pages (“Create a variation with AI”).

---

## 17) Testing Plan

- **Unit:** parser normalization, default group insertion, enum/type mapping (`RecipeType`).
- **Integration:** end-to-end generate → preview → save; regeneration by scope; tag connectOrCreate.
- **Property-based tests:** random ingredient lines → parser stability.
- **Fixtures:** vegan, gluten-free, one-pot, 15-min, budget, kids.

---

## 18) Open Questions

- Do you want to **always** run your importer before DB insert, or insert raw and run a background parser to enrich `Ingredient` fields?
- Should we add an **AIGeneration** table for audit, or embed JSON in `Recipe.description` footer (e.g., `---\nGenerated from prompt: ...`)?
- Should “servings” be stored (not currently in `Recipe`)? If important, either add a field or store in `description`.

---

## 19) Effort & Dependencies (Rough)

- **Backend APIs (generate, refine, save):** 2–3 days.
- **UI (prompt page, preview, edit, warnings):** 3–5 days.
- **Parser/normalizer & guardrails:** 2–3 days.
- **Telemetry + admin audit:** 1–2 days.
- **Total v1:** \~1.5–2.5 weeks of focused work.

---

## 20) Example Prompts (for your “Examples” dropdown)

- “Cozy fall soup with pumpkin and sage, 30 mins, 4 servings, vegetarian.”
- “Sheet-pan chicken dinner, low-carb, weeknight friendly, 35 mins.”
- “Kids-approved pasta, no nuts, mild spice, 20 mins.”
- “Mexican + Japanese fusion taco, pescatarian, budget friendly.”

---

If you want, I can **stub the UI** (Solid/React) for the Prompt page and the Preview editor next, plus a **strict JSON tool schema** ready to drop into your OpenAI call.

## 21) Plan & Steps to Build

### 21.1 Backend (OpenAI + API)

- **Dependencies**

  - Install OpenAI SDK:

    ```bash
    npm i openai
    ```

  - Add `OPENAI_API_KEY` to `.env.local`. Keep it server-only.

- **Server module** (`src/server/ai/recipe.ts`)

  - Implement `callOpenAI(request)` using OpenAI Chat Completions with a tool schema that emits the structured recipe JSON (per section 7.2). Use model `gpt-4o-mini` with tool-calling.
  - Implement `parseAndValidate(json)` to enforce guardrails: ensure ≥1 ingredient group and ≥1 step group, trim lines, clamp counts, and collect warnings.
  - Implement `toImporterPayload(recipe)` to return text blocks if needed for the existing importer.
  - Use project aliases (`~`) consistently (e.g., `import { db } from "~/server/db"`).

- **API route** (`src/app/ai/generate-recipe/route.ts`)
  - Create a Next.js App Route `POST` handler that accepts `GenerateRecipeRequest`, calls `callOpenAI`, validates, and returns `GenerateRecipeResponse`.
  - Include `regenerateScope` passthrough to support partial regeneration later.

### 21.2 Persistence (DB Save)

- **New tRPC mutation** (`src/server/api/routers/recipe.ts`)

  - Add `createRecipeFromAI`: input mirrors `GeneratedRecipe` (name, description, optional cookMinutes/type/tags, `ingredientGroups[]`, `stepGroups[]`).
  - Implementation:
    - Insert `Recipe` (include `type` and `cookMinutes` if provided) with `userId` from session.
    - Create `IngredientGroup[]` with `order = index`, and `Ingredient[]` with `rawInput` set to each line (leave parse fields empty for now).
    - Create `StepGroup[]` with `steps` string arrays.
    - If tags provided, connect or create via `db.tag` (use existing tag helpers in `tagRouter` as reference).

- **Alternative (optional)**

  - Convert structured groups to importer text (`[Group]\n...`) and reuse `createRecipeFromTextInput` to centralize parsing. Keep `createRecipeFromAI` for direct structured saves.

- **Provenance (optional)**
  - For v1, append a short provenance block to `Recipe.description` (prompt, model, date). If you prefer a table, add `AIGeneration` later.

### 21.3 Client UI (Prompt → Preview → Save)

- **Page** (`src/app/ai/recipe/page.tsx`)

  - Gate with `useEnforceAuth`.
  - Provide a large prompt textarea and constraint chips (Servings, Time, Diet, Cuisine, Tools, Skill, Spice).
  - “Generate” calls `/ai/generate-recipe` and stores the returned `GeneratedRecipe` + `warnings` in state.

- **Preview**

  - Tabs: Form View and Text View.
    - Form View: editable name/description; group lists with inline edits and add/split/merge.
    - Text View: render `[Group]` blocks and step blocks exactly as importer expects.
  - “Regenerate Section”: send `regenerateScope` = `ingredients | steps | all`; merge minimal deltas while preserving user edits where possible.
  - “Validate”: show warnings and quick-fix actions (normalize units, expand ranges) using client helpers.

- **Save**
  - Primary action calls `api.recipe.createRecipeFromAI.mutateAsync(...)` with the edited structure.
  - Post-save: toast with link; optional modals “Add to Shopping List?” and “Plan a date?” (reuse existing flows).

### 21.4 Validation & Guardrails

- Server `parseAndValidate` performs minimum structure checks and trimming.
- Client mirrors key checks to provide instant feedback.
- Keep counts sane: 3–24 ingredient lines, 3–15 steps; ensure non-empty group titles.

### 21.5 Security & Limits

- Keep `OPENAI_API_KEY` server-side only; never expose to the client.
- Protect endpoints with session checks (reuse `protectedProcedure` for tRPC; in App Route, read session and reject if missing).
- Add simple per-user rate limiting for generation (e.g., cap N/day) in the App Route.

### 21.6 Observability

- Log: user id, latency, token usage (if available), success/failure, warning counts.
- Emit events: `ai.generate.started|succeeded|failed`, `recipe.saved`.

### 21.7 Testing

- Unit: `parseAndValidate`, enum/type coercion (`RecipeType`), text block rendering.
- Integration: end-to-end generate → preview → save; tag `connectOrCreate`.
- Fixtures: vegetarian/vegan, gluten-free, quick 15–30 min, budget, kids.

### 21.8 Rollout

- Add “AI Recipe” entry to creation UI/nav.
- Alpha (internal): enable for signed-in owner; log all outputs.
- Beta: enable for users; rate limit; add thumbs-up/down with comment.

### 21.9 Concrete Tasks (Checklist)

- **Backend**

  - [ ] Create `src/server/ai/recipe.ts` with `callOpenAI`, `parseAndValidate`, `toImporterPayload`.
  - [ ] Add App Route `src/app/ai/generate-recipe/route.ts` (POST) returning `GenerateRecipeResponse`.
  - [ ] Add tRPC mutation `recipe.createRecipeFromAI` (structured save) in `src/server/api/routers/recipe.ts`.
  - [ ] Implement tag connect/create logic (reuse `tagRouter` patterns).
  - [ ] Add basic per-user rate limiting and logging.

- **Client**

  - [ ] Build `src/app/ai/recipe/page.tsx` with prompt + constraints and Generate button.
  - [ ] Implement Preview editor (Form + Text tabs) with inline edits and warnings.
  - [ ] Implement Regenerate Section using `regenerateScope`.
  - [ ] Implement Save via `api.recipe.createRecipeFromAI` and show post-save CTAs.

- **Infra**

  - [ ] `npm i openai`; add `OPENAI_API_KEY` to `.env.local`.
  - [ ] Verify path aliases (`~`) in tsconfig; avoid mixing `@/` and `~/`.
  - [ ] Add minimal telemetry (console or your logging solution).

- **Optional Enhancements**
  - [ ] Add `AIGeneration` table for audit trail.
  - [ ] Background parser to enrich `Ingredient` parse fields after insert.
  - [ ] Cache prompt+constraints hash to avoid duplicate charges.
