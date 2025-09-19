Hi, here’s a detailed PRD for **AI Meal Plan Generation** tailored to your schema and current workflows. It mirrors the depth/format of the “Prompt → Recipe” PRD and assumes OpenAI for planning logic.

---

# Product Requirements Document — “AI Meal Plan Generation”

> **One-liner:** Users specify constraints (dates, family size, diet, time, budget). The system generates a balanced weekly plan (Breakfast/Lunch/Dinner + optional snacks), picks recipes (existing or AI-generated), scales servings, and produces a consolidated shopping list with one-click plan/save.

---

## 1) Goals & Non-Goals

- **Goals**

  - Create a **multi-day plan** (default 7 days) mapped to your `PlannedMeal` model.
  - Respect dietary constraints, time windows, budgets, and family preferences.
  - Balance **variety** (cuisines, proteins), **effort** (quick vs involved days), and **leftover reuse**.
  - Produce a **one-click shopping list** from the plan.
  - Support **regenerate**, **lock**, and **swap** for individual slots.

- **Non-Goals (v1)**

  - Full macro tracking with exact grams (provide “soft targets” v1; hard macros can be v2).
  - Price guarantees (we can estimate via Kroger later; v1 focuses on counts & categories).
  - Rich media generation (images) for every slot.

---

## 2) Personas

- **Time-pressed home cook**: wants a quick, sensible weekly plan + list.
- **Nutrition-motivated user**: wants guardrails (e.g., high-protein, low-sodium).
- **Power user**: wants fine-grained controls (lock slots, force leftovers, budget ceilings).

---

## 3) Success Metrics

- **Plan adoption:** % of generated plans that are **saved** (target ≥45%).
- **Editing depth:** avg. locks/swaps per plan (target 1–3, suggests usable first draft).
- **Grocery follow-through:** % plans that trigger **shopping list** generation (target ≥60%).
- **Variety score:** no repeated main protein or cuisine two days in a row (target ≥85% plans).

---

## 4) Core Features & UX Affordances

- **A. Plan Config Panel (Pre-generation)**

  - Inputs: date range (default next Mon–Sun), **meals per day** (B/L/D + snacks toggle), **servings** (family size), **diet/allergies**, **time constraints** (e.g., ≤30 min on weekdays), **budget (rough)**, **cuisine preferences**, **leftovers policy** (e.g., “repurpose 2×/week”).
  - Chips/shortcuts: “Quick weeknight,” “High-protein,” “Kids-friendly,” “Budget.”
  - **Affordances:** live summary pill (“7 days · 14 meals · serves 5 · ≤30 min weekdays”).

- **B. First Draft Generation (Server)**

  - OpenAI returns a **structured weekly plan** referencing existing recipe IDs when possible; can fallback to **Prompt→Recipe** generator for gaps (optional toggle).
  - Ensures valid count per day, serving scaling, tags alignment (diet/cuisine).

- **C. Plan Canvas (Grid)**

  - Calendar grid (rows=days, cols=meals). Each cell shows: recipe name, cook time, tags.
  - **Actions per cell:** Lock 🔒, Swap 🔁, View/Edit, Replace with (search), Regenerate (cell/day).
  - **Affordances:** Hover shows quick nutrition estimates (if available), leftover badges.

- **D. Diversity & Constraints Sidebar**

  - Live diagnostics (diet violations, duplicates, >2 pasta in week, time hot-spots).
  - Toggle to **enforce** or **relax** rules; “Fix issues” button to auto-adjust slots.

- **E. Shopping List Integration**

  - “Generate list” merges all plan ingredients → deduped by aisle/category.
  - Optional: **Add to Kroger cart** (existing integration), but v1 can simply stage a categorized list.

- **F. Saving & Planning**

  - “Save plan” creates `PlannedMeal` records for the selected date range with `scale` set to servings/household size.
  - Post-save CTAs: “Add shopping list now?” and “View weekly plan.”

- **G. Iteration**

  - Global “Regenerate” (with or without respecting locked slots).
  - “Swap with…” command palette (search existing recipes by tags, cook time, type).
  - Variations: “More veggies this week,” “One meatless day,” “Lower total prep time.”

- **H. History & Attribution**

  - Store the configuration, constraints, model version, and selected recipe IDs for audit.
  - Quick “Duplicate plan” for future weeks.

---

## 5) Modes (for users)

| Mode                 | When to use                     | Notes                                                |
| -------------------- | ------------------------------- | ---------------------------------------------------- |
| **Quick Week**       | Need a sensible plan in 1 click | Defaults: dinner only, ≤35 min on weekdays           |
| **Macro-Aware** (v2) | Fitness/nutrition               | Soft macro targets/day; per-meal balance optional    |
| **Budget-Aware**     | Constrain cost                  | Uses ingredient heuristics now; Kroger prices later  |
| **Leftover-First**   | Reduce waste                    | Forces 1–2 planned leftover meals & ingredient reuse |

---

## 6) Data & Schema Mapping (no changes required)

- **`PlannedMeal`**

  - Use `date` for slot timestamps (store meal type in description or in a new enum later).
  - Use `scale` for servings.
  - Link to `Recipe` via `recipeId`, `userId` required.
  - `isMade`/`isOnShoppingList` flow stays unchanged.

- **`Recipe` / `IngredientGroup` / `StepGroup`**

  - Read-only at plan time; we only reference and scale.

- **`ShoppingList`**

  - Create items linked to `ingredientId` when possible; otherwise loose items.
  - Optional immediate creation after plan save.

> **Note:** Meal “type” (Breakfast/Lunch/Dinner) is not a first-class field in `PlannedMeal`. For v1, encode it in the `description` (“\[DINNER] Chicken Teriyaki”). For v2, consider a `mealType` enum on `PlannedMeal`.

---

## 7) Interfaces & Contracts

### 7.1 Client → Server (Generate Plan)

```ts
// Request
{
  "startDate": "2025-09-22",
  "endDate": "2025-09-28",
  "mealsPerDay": ["DINNER"], // e.g., ["BREAKFAST","LUNCH","DINNER"]
  "servings": 5,
  "constraints": {
    "timeWeekdayMax": 35,
    "timeWeekendMax": 60,
    "diet": ["vegetarian"],               // or []
    "allergies": ["peanut"],
    "cuisinesPreferred": ["Mexican","Italian"],
    "cuisinesAvoid": ["Thai"],
    "budgetLevel": "medium",              // "low" | "medium" | "high"
    "leftoversPerWeek": 2,                // how many leftover/repurpose slots
    "includeNewAIRecipes": false          // fallback to Prompt→Recipe when needed
  },
  "respectLocks": true,                   // when regenerating
  "lockedSlots": [ {"date":"2025-09-24","meal":"DINNER","recipeId":123} ]
}
```

```ts
// Response
{
  "ok": true,
  "plan": {
    "days": [
      {
        "date": "2025-09-22",
        "meals": [
          {
            "meal": "DINNER",
            "recipeRef": { "recipeId": 231, "source": "existing" },
            "servings": 5,
            "estimatedCookMinutes": 30,
            "tags": ["vegetarian","mexican","30-minute"],
            "notes": "Quick skillet; serve with lime."
          }
        ]
      },
      // ... 6 more days
    ],
    "diagnostics": {
      "violations": [],
      "variety": { "proteinsOk": true, "cuisinesOk": true },
      "leftoversScheduled": 2
    }
  },
  "warnings": ["2 recipes close to 45 min; exceeds weekday target"]
}
```

### 7.2 Server → OpenAI (Planner)

- **System prompt (sketch):**
  “You are a professional meal planner. Produce a **diverse, diet-compliant** weekly plan using the provided recipe catalog. Prefer ≤35 min on weekdays, allow longer on weekends. Output JSON matching the tool schema. If `includeNewAIRecipes=false`, only reference catalog items.”

- **Tool schema (excerpt)**

```json
{
  "name": "emit_meal_plan",
  "parameters": {
    "type": "object",
    "properties": {
      "days": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "date": { "type": "string" },
            "meals": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "meal": {
                    "type": "string",
                    "enum": ["BREAKFAST", "LUNCH", "DINNER", "SNACK"]
                  },
                  "recipeRef": {
                    "type": "object",
                    "properties": {
                      "recipeId": { "type": "integer" },
                      "source": {
                        "type": "string",
                        "enum": ["existing", "ai_generated"]
                      }
                    },
                    "required": ["source"]
                  },
                  "servings": { "type": "integer" },
                  "estimatedCookMinutes": { "type": "integer" },
                  "tags": { "type": "array", "items": { "type": "string" } },
                  "notes": { "type": "string" }
                },
                "required": ["meal", "recipeRef", "servings"]
              }
            }
          },
          "required": ["date", "meals"]
        }
      },
      "diagnostics": { "type": "object" }
    },
    "required": ["days"]
  }
}
```

### 7.3 Server → DB (Save Plan)

- For every slot in `days[*].meals[*]`, create a `PlannedMeal`:

  - `date`: ISO date (choose noon local for all; meal label goes in description).
  - `recipeId`: from `recipeRef` (create recipe first if `ai_generated`).
  - `scale`: set to `servings`.
  - `userId`: current user.
  - `description`: `"[DINNER] <Recipe Name> | notes: <...>"`.

- Optionally: Immediately create `ShoppingList` entries (or defer to post-save CTA).

---

## 8) Algorithm Notes (Server-side)

- **Catalog filter**: start from `Recipe` that matches diet/allergy tags; exclude user-hidden recipes.
- **Scoring** per candidate recipe:

  - Time fit (weekday/weekend), cuisine diversity penalty for repeats, protein rotation, historical “liked” boost, leftover friendliness.

- **Diversity constraints**:

  - No same cuisine back-to-back; rotate cooking methods; cap pasta/potato > 2×/week.

- **Leftover chaining** (optional v1)

  - When a recipe produces leftovers (servings > family size or ingredient overage), schedule a follow-on “Leftover Remix” slot (could be a simple cold lunch or planned repurpose dish).

- **Budget heuristic (v1)**

  - Penalize recipes with many unique fresh items; favor pantry/staples and repeat usage within week.

---

## 9) Validation & Guardrails

- **Hard validation**

  - All days between start/end have requested meal slots.
  - Every slot has a `recipeId` (or `ai_generated` recipe provided inline to be created).
  - Total servings ≥ household size.

- **Soft warnings**

  - > N minutes on weeknights, > M repeated cuisines, diet/allergy conflicts.

- **Auto-fix**

  - “Fix all time conflicts” → replace long recipes with faster alternatives.
  - “Increase variety” → re-score and swap repeated cuisines.

---

## 10) UI/UX Flows

- **Entry (Create → AI Meal Plan)**

  - Config panel → “Generate Plan”.

- **Grid View**

  - Each cell: title + tags + time; **Lock/Swap/Regenerate** on hover.
  - Bulk actions: Regenerate all unlocked, Enforce variety, Enforce time limits.

- **Inspect Drawer (cell click)**

  - Recipe details, quick edit to `servings`, “View recipe”, “Replace with…”.

- **Save**

  - “Save Plan” → `PlannedMeal[]` created.
  - Post-save: “Generate shopping list” → categorized list; “Send to Kroger” (optional).

---

## 11) Example TS Types & Handlers

```ts
// types.mealplan.ts
export type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface PlanConstraints {
  timeWeekdayMax?: number;
  timeWeekendMax?: number;
  diet?: string[];
  allergies?: string[];
  cuisinesPreferred?: string[];
  cuisinesAvoid?: string[];
  budgetLevel?: "low" | "medium" | "high";
  leftoversPerWeek?: number;
  includeNewAIRecipes?: boolean;
}

export interface GeneratePlanRequest {
  startDate: string; // ISO date
  endDate: string; // ISO date
  mealsPerDay: MealSlot[];
  servings: number;
  constraints?: PlanConstraints;
  respectLocks?: boolean;
  lockedSlots?: { date: string; meal: MealSlot; recipeId: number }[];
}

export interface PlanRecipeRef {
  recipeId?: number;
  source: "existing" | "ai_generated";
  aiRecipePayload?: any; // if source=ai_generated, full recipe JSON (Prompt→Recipe)
}

export interface PlanCell {
  meal: MealSlot;
  recipeRef: PlanRecipeRef;
  servings: number;
  estimatedCookMinutes?: number;
  tags?: string[];
  notes?: string;
}

export interface PlanDay {
  date: string; // ISO date
  meals: PlanCell[];
}

export interface GeneratePlanResponse {
  ok: boolean;
  plan?: { days: PlanDay[]; diagnostics?: any };
  warnings?: string[];
  error?: string;
}
```

```ts
// api/ai/generate-meal-plan.ts
import { NextRequest, NextResponse } from "next/server";
import type {
  GeneratePlanRequest,
  GeneratePlanResponse,
} from "@/types/mealplan";
import { planWithOpenAI, validatePlan } from "@/lib/mealplan/engine";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GeneratePlanRequest;
  console.log("[mealplan] request:", JSON.stringify(body)); // debug
  if (!body.startDate || !body.endDate || !body.mealsPerDay?.length) {
    return NextResponse.json<GeneratePlanResponse>(
      { ok: false, error: "Missing dates or mealsPerDay" },
      { status: 400 },
    );
  }
  try {
    const plan = await planWithOpenAI(body);
    const warnings = validatePlan(plan, body);
    return NextResponse.json<GeneratePlanResponse>({
      ok: true,
      plan,
      warnings,
    });
  } catch (e) {
    console.error("[mealplan] error:", e);
    return NextResponse.json<GeneratePlanResponse>(
      { ok: false, error: "Generation failed" },
      { status: 500 },
    );
  }
}
```

```ts
// lib/mealplan/persist.ts
import { prisma } from "@/lib/prisma";
import type { PlanDay } from "@/types/mealplan";

export async function savePlan(userId: string, days: PlanDay[]) {
  console.log("[savePlan] days:", days.length); // debug
  for (const d of days) {
    for (const cell of d.meals) {
      const recipeId =
        cell.recipeRef.recipeId ??
        (await createRecipeIfNeeded(userId, cell.recipeRef));
      await prisma.plannedMeal.create({
        data: {
          date: new Date(d.date + "T12:00:00"), // noon local for simplicity
          isMade: false,
          isOnShoppingList: false,
          scale: cell.servings,
          recipeId,
          userId,
          // Encode meal type for v1:
          // eslint-disable-next-line
          Recipe: undefined as any, // prisma relation handled by recipeId
        },
      });
    }
  }
}
```

---

## 12) Shopping List Generation (from Plan)

- **Process**

  - Expand all selected recipes → aggregate `Ingredient` lines.
  - Deduplicate by normalized ingredient name + unit.
  - Group by aisle when available; otherwise group by coarse categories.

- **UX**

  - “Create list from plan” button after save.
  - Toggle: include pantry items (off by default).

---

## 13) Observability

- Events: `mealplan.generate.started/succeeded/failed`, `mealplan.save.succeeded`, `mealplan.swap`, `mealplan.lock`.
- Metrics: p50/p95 generation time, violation/warning counts, % slots modified by user, shopping-list attach rate.
- Logs: constraints, model, recipe IDs chosen.

---

## 14) Security & Privacy

- Server-side OpenAI calls; never expose keys.
- Minimal prompt logging (hash user content); redact PII if pasted.
- Rate limiting per user/day.

---

## 15) Edge Cases

- **Empty catalog after filters** → suggest relaxing constraints or allow `includeNewAIRecipes=true`.
- **Allergies conflict** → hard block slot and surface “conflicting ingredient” list; “Auto-fix” replaces those recipes.
- **Weekend shift** → if startDate mid-week, still produce complete range with weekday/weekend rules applied per date.
- **Time zone** → normalize to user TZ when writing `PlannedMeal.date`.

---

## 16) Rollout Plan

- **Alpha:** Dinner-only, 7 days, existing recipes only, no macros.
- **Beta:** Add leftovers policy, budget heuristic, per-slot regenerate, shopping list.
- **GA:** Add breakfast/lunch/snacks, optional Prompt→Recipe fallback, soft macro targets.

---

## 17) Testing

- **Unit:** day expansion, variety scoring, constraint enforcement, leftovers placement.
- **Integration:** generate → lock few slots → regenerate respecting locks → save → list.
- **Property tests:** random constraints → no invalid plan shapes; diet violations = 0.

---

## 18) Effort (Rough)

- Planner API + OpenAI tool schema + scoring: **3–5 days**
- Grid UI + locks/swaps/regenerate: **4–6 days**
- Save + Shopping List integration: **2–3 days**
- Telemetry + QA: **1–2 days**
- **Total v1:** \~2–3 weeks focused.

---

## 19) Example “Examples” (one-click presets)

- **Quick Weeknight**: Dinner only · ≤35 min weekdays · 1 leftover slot · serves 4.
- **Kids-Friendly**: Dinner only · mild spice · pasta 1×/week max · serves 5.
- **Budget**: Dinner only · low budget · shared ingredients across week · serves 4.
- **Veggie-Forward**: Dinner only · vegetarian · ≥3 legume-based meals/week · serves 4.

---

## 20) Open Questions

- Do you want to **add `mealType`** to `PlannedMeal` now (enum) vs. encode in description?
- Should we allow plan-level **Kroger price estimation** (sum of cheapest matches) v1, or defer?
- How aggressively should we **reuse ingredients** for budget vs. **maximize variety**? (Expose slider?)

---

If you’d like, I can stub the **Solid/React grid UI** (calendar with lock/swap/regenerate), plus the **OpenAI tool schema** and the **server planner scaffold** so you can drop it into your existing Next.js routes.
