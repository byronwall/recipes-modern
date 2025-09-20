# Meal History–Driven Recommendations PRD

## 1) Problem & Opportunity

Users plan meals in advance using `PlannedMeal` and mark them as made via `isMade`. Today, history is not surfaced visually nor summarized. We want to:

- Make cooking history visible and useful at-a-glance (per recipe and across time)
- Summarize popularity (total makes, recent makes, last made) to guide choices
- Show recent history context on the plan page and offer simple, history-based suggestions
- Prepare UX surfaces and simple scoring so we can swap to AI-driven ranking later

Success means users can quickly see “what we actually cook,” discover patterns, and accept relevant suggestions with confidence.

## 2) Current State (from code)

- `PlannedMeal` has: `date`, `isMade`, `isOnShoppingList`, `scale`, `recipeId`, `userId`.
- Meal plans are fetched via `recipeRouter.getMealPlans` with `PlannedMeal` + `Recipe.tags`.
- Meal plan updates are handled by `mealPlanRouter.updateMealPlan` (can toggle `isMade` and change `date`).
- `Recipe` has `type` (enum) and optional `cookMinutes`, plus `tags`.

Implication: We already have minimal viable history via `PlannedMeal.isMade` + `date`. No dedicated history table yet.

## 3) Goals

- Use cooking recency/frequency to diversify recommendations.
- Reflect user preferences automatically (soft “like” signals via repeat makes).
- Respect constraints: budget, time, diet tags; avoid over-repetition.
- Keep UX simple: lightweight status marking and easily explainable suggestions.

## 4) Non-Goals

- Full explicit ratings/reviews (can be v2).
- Nutrition macros, pantry inference, or price optimization (separate PRDs).

## 5) Core Ideas (visualizations and suggestions)

1. Recipe popularity chips: show total makes (all-time), last 30/90-day counts, and “last made X days ago”.
2. Sort & filter on recipe list: sort by popularity, last made, trending; filter by “not made in 60/90 days”.
3. Tag-level stats: show top tags by makes in last 30/90 days to reveal current themes.
4. Plan page recent history panel: last 14/30 days timeline with dots per day and counts; quick link to details.
5. “Not made lately” tray: list 5–10 recipes not cooked in the last N days, ranked by lifetime popularity.
6. “Often cooked” tray: top 5 past 90-day recipes, with spacing guidance to avoid over-repeat.
7. Simple suggestions module: 3–6 suggestions with short reasons (e.g., “Not made in 47 days”, “Quick 20 min”).
8. Recency decay scoring: boost items longer since last made; cap with a hard no-repeat window (e.g., 10–14 days).
9. Time-budget fit: use `Recipe.cookMinutes` to align with per-day targets; mark picks as “Quick” or “Long”.
10. Explainability: “Why suggested?” chips reflecting recency, quickness, variety, or tag rotation.
11. Exploration quota: reserve 10–20% for untried or long-dormant recipes to avoid staleness.

## 7) Algorithm v1 (simple, explainable)

- Inputs:
  - User’s `PlannedMeal` history (`isMade = true`) with `date`
  - Candidate `Recipe` set with `type`, `tags`, `cookMinutes`
- For each candidate recipe:
  - Recency score = min(90, daysSinceLastMade) / 90
  - Frequency penalty = clamp(recentMadeCount / targetRepeatPerWindow)
  - Time fit = 1 if within target cookMinutes bucket for that slot; else 0.7
  - Tag variety bonus = +0.1 if underrepresented tag this week
  - Cold-start bonus = +0.05 if never made
  - Total = weighted sum; exclude if made within hard window X days
- Pick top-N per slot with same-week and adjacency constraints; keep 10–20% novelty quota.
- Return explanations per pick.

## 8) UX Changes

- Recipe list (`/`):
  - Show popularity chip per card: total makes, last 90/30, and “last made X days”.
  - Optional 12-week sparkline next to the recipe name on larger screens.
  - Sorting menu: Popularity, Last Made (oldest first), Trending; filters for “Not made in 60/90 days”.
- Recipe detail:
  - History timeline of make dates with tooltips; tag-level stats for the recipe (e.g., cuisine consistency).
- Plan page (`/plan`):
  - Recent history panel: last 14/30 days calendar strip with dots and counts; link to full history view.
  - “Not made lately” and “Often cooked” trays.
  - Suggestions module: 3–6 items with “Why suggested?” reasons; accept/replace actions.
  - Prominent “Mark made” toggle; optional “Undo” within a short window; log time (see `madeAt` below).
  - Light preference controls: rotation window (days), weekly time target, novelty %.

## 9) APIs

- Read:
  - Extend `getMealPlans({ from, to })` to support date range filtering.
  - New `getMealHistorySummary({ windowDays })` → totals, last made per recipe, 30/90-day counts, trending flags.
  - New `getRecipeHistoryStats({ recipeId })` → per-recipe dates, counts, last made, 12-week bins for sparkline.
- Write:
  - Existing `updateMealPlan` to toggle `isMade` and adjust `date`; optionally extend to set `madeAt`.
- Suggestions (simple v1):
  - `getSuggestionsSimple({ weekStart, weekEnd, count })` → ranked candidates + `why: string[]`.
  - Contract mirrors future AI API so we can swap implementations later.

## 10) Rollout Plan

- v1: implement scoring service and surface suggestions in the planner UI (no schema changes).
- v1.1: add user preference inputs and store in-memory or simple user extras.
- v2: add `madeAt`, `mealType`, explicit ratings, and richer signals.

## 11) Metrics

- % of planned meals accepted without edits
- Unique recipes per 4-week window
- Average cookMinutes variance per week vs target
- Repeat interval distribution (pushed right = more variety)
- Time to plan (open → save), before vs after history visuals
- Click-through rate on suggestions and “Why suggested?” reveals
- Usage of recipe list sorts/filters related to history
- Share of “not made lately” picks that get accepted

## 12) Risks & Mitigations

- Over-penalizing favorites → cap frequency penalty, add “pin favorite” control.
- Data sparsity for new users → novelty boost and curated defaults.
- Explainability complexity → limit to 2–3 reasons per suggestion.

## 13) Plan + steps to build

## Overview

- Target v1 scope focuses on simple, explainable history summaries and suggestion logic with no schema changes.
- Work streams: 1) History aggregation service + APIs, 2) UI surfacing on recipe list/detail and plan page, 3) Simple suggestions service.
- Ship behind a feature flag in UI so pieces can merge incrementally.

## Foundations (shared across ideas)

- Add a small history aggregation helper (no schema change):

  - File: `src/server/historyService.ts`
  - Expose functions (backed by Prisma on `PlannedMeal`):
    - `getPerRecipeHistory({ userId, windowDays })` → `{ recipeId, totalAllTime, last30, last90, lastMadeAt }[]`
    - `getTagHistory({ userId, windowDays })` → `{ tagId, last30, last90, totalAllTime }[]`
    - `getRecentCalendar({ userId, from, to })` → `{ date, madeCount }[]`
    - `getRecentCounts({ userId, from, to })` → rollups for quickly populating trays
  - All queries use `isMade = true` and join `Recipe` and `Recipe.tags` where needed.

- TRPC endpoints (new or extended):

  - In `src/server/api/routers/mealPlanRouter.ts`:
    - `getMealHistorySummary({ windowDays: number })`
    - `getRecipeHistoryStats({ recipeId: string })`
    - `getRecentCalendar({ from: string, to: string })`
    - `getSuggestionsSimple({ weekStart: string, weekEnd: string, count?: number })`
  - In `src/server/api/routers/recipe.ts`:
    - Extend list query to accept `sort`, `filter` for history-aware sorts/filters (uses server-side joins/aggregates from service).
  - In `src/server/api/routers/tagRouter.ts`:
    - `getTagHistorySummary({ windowDays: number })`

- UI primitives:
  - Popularity chip component: `src/components/ui/PopularityChip.tsx`
  - Simple sparkline (12-week): `src/components/ui/MiniSparkline.tsx`
  - Suggestion card + reasons chips: `src/components/ui/SuggestionCard.tsx`

---

## Detailed plan by idea (1–11)

### 1) Recipe popularity chips

- Data: `totalAllTime`, `last90`, `last30`, `lastMadeAt` per recipe.
- API: `mealPlanRouter.getMealHistorySummary({ windowDays: 90 })`.
- UI:
  - Show chip on `src/app/RecipeCard.tsx` and `src/app/RecipeList.tsx`.
  - Optional hover tooltip with breakdown.
- Acceptance:
  - Chip renders for all recipes; values match counts from DB spot-checks.
- Next steps:
  1. Implement `getPerRecipeHistory` in `historyService.ts`.
  2. Add TRPC `getMealHistorySummary` returning a map keyed by `recipeId`.
  3. Inject data into recipe list query or fetch in parallel in `RecipeList.tsx`.
  4. Build `PopularityChip.tsx` and wire into `RecipeCard.tsx`.

### 2) Sort & filter on recipe list

- Sort: Popularity (last90 desc), Last Made (oldest first), Trending (last30 vs last90 delta).
- Filter: Not made in 60/90 days.
- API: extend `recipe.list` in `src/server/api/routers/recipe.ts` with `{ sort?: 'popularity'|'lastMade'|'trending', notMadeDays?: number }`.
- UI: Add controls to `src/app/page.tsx` or `src/app/RecipeList.tsx` header menu.
- Acceptance: Changing sort/filter updates results server-side; pagination stable.
- Next steps:
  1. Extend recipe list procedure to join history aggregates (via `historyService`).
  2. Add params to TRPC client hook and UI menu.
  3. Display current sort/filter chips; ensure SSR hydration safe.

### 3) Tag-level stats

- Data: count of makes per tag in last 30/90, totalAllTime.
- API: `tagRouter.getTagHistorySummary({ windowDays })`.
- UI: Small panel on recipe list page side column; later a full history view.
- Acceptance: Top tags reflect recent behavior; matches DB spot-checks.
- Next steps:
  1. Implement `getTagHistory` aggregation.
  2. Add TRPC endpoint and wire a compact UI section in `src/app/page.tsx`.

### 4) Plan page recent history panel

- Data: `getRecentCalendar({ from, to })` last 14/30 days with counts.
- UI: Add panel to `src/app/plan/PlanPageClient.tsx` with a compact calendar strip.
- Acceptance: Dates align with timezone; clicking opens a basic details list.
- Next steps:
  1. Implement calendar aggregation and TRPC endpoint.
  2. Build a simple strip component; add link to open detail modal.

### 5) “Not made lately” tray

- Rule: Recipes not made in N days, ranked by lifetime popularity.
- API: Add server method using `lastMadeAt` + all-time counts.
- UI: Tray on `src/app/plan/PlanPageClient.tsx`.
- Acceptance: All items satisfy `daysSinceLastMade >= N` and sort correctly.
- Next steps:
  1. Implement helper `getNotMadeRecently({ days })` in `historyService`.
  2. Expose via `mealPlanRouter.getMealHistorySummary` or dedicated endpoint.
  3. Render tray and support quick add to plan.

### 6) “Often cooked” tray

- Rule: Top recipes by last 90 days makes; show spacing guidance.
- API: Part of `getMealHistorySummary`.
- UI: Tray on plan page with “Made X times in 90d, last Y days ago”.
- Acceptance: Counts and spacing text correct.
- Next steps:
  1. Compute last90 counts per recipe.
  2. Render tray with inline `Why` tooltips.

### 7) Simple suggestions module

- Algorithm: Use section 7 (recency, frequency penalty, time fit, tag variety, cold start, hard no-repeat window).
- API: `mealPlanRouter.getSuggestionsSimple({ weekStart, weekEnd, count })` returning `{ recipe, score, why: string[] }[]`.
- UI: `SuggestionCard` grid on plan page with accept/replace; show reason chips.
- Acceptance: Reasons are concise and accurate; accept adds to plan.
- Next steps:
  1. Implement `suggestSimple()` in a new `src/server/suggestions/simple.ts` using historyService.
  2. Add TRPC endpoint and types; return deterministic results for same input.
  3. Build `SuggestionCard` and wire accept/replace actions.

### 8) Recency decay scoring

- Detail: `recency = min(90, daysSinceLastMade)/90`; exclude if made within X days (10–14 default).
- Implementation: inside `suggestSimple()` with constants colocated and unit-tested.
- Acceptance: Unit tests cover boundary conditions and window exclusion.
- Next steps:
  1. Add pure scoring function with tests in `simple.ts`.
  2. Expose config via function args (defaults for v1).

### 9) Time-budget fit

- Use `Recipe.cookMinutes`; slot target inferred from day-of-week defaults for v1.
- UX: Show Quick/Normal/Long chip in suggestions; allow override later (v1.1).
- Acceptance: Items outside bucket get lower score and appropriate reason.
- Next steps:
  1. Define cook time buckets (e.g., Quick ≤ 25, Normal 26–50, Long > 50).
  2. Add `timeFit` term to scoring and reason generation.

### 10) Explainability

- “Why suggested?” chips: recency, quickness, variety, novelty.
- Implementation: suggestions API returns up to 3 reason strings per item.
- UI: Inline chips on `SuggestionCard`; info icon opens full list if truncated.
- Acceptance: Reasons map 1:1 to scoring terms.
- Next steps:
  1. Add reason builder in `simple.ts` that mirrors scoring branches.
  2. Render chips and ensure a11y labels.

### 11) Exploration quota

- Rule: Reserve 10–20% of suggestions for never-made or long-dormant recipes.
- Implementation: After ranking, sample from novelty pool for the reserved slots.
- Acceptance: At least one novelty pick appears when pool is non-empty.
- Next steps:
  1. Compute novelty pool (never-made or lastMadeAt > 180d).
  2. Fill reserved slots after top picks; annotate with a novelty reason.

---

## Sequencing (sprint-ready)

1. Foundations: `historyService.ts` + TRPC read endpoints (Ideas 1,3,4 building blocks).
2. Idea 1: Popularity chips on recipe cards.
3. Idea 2: Recipe list sort/filter (server + UI).
4. Idea 4: Plan page recent history panel.
5. Ideas 5–6: Trays on plan page.
6. Ideas 7–11: Suggestions service, UI, and scoring explanations.

## Non-breaking changes & flags

- Feature flag: `HISTORY_SUGGESTIONS_ENABLED` in UI to progressively expose panels.
- All endpoints are additive; no schema migrations in v1.

## Testing

- Unit: scoring functions (recency, frequency penalty, timeFit, novelty quota).
- Integration: TRPC endpoints hitting Prisma with seed fixtures.
- UI: Storybook/Chromatic for chips, trays, and suggestion cards.

## Next steps (actionable)

- Create `src/server/historyService.ts` with per-recipe, tag, and calendar aggregations.
- Add TRPC endpoints in `mealPlanRouter.ts`, `recipe.ts`, `tagRouter.ts` as specified.
- Build `PopularityChip.tsx`; integrate into `RecipeCard.tsx` and `RecipeList.tsx`.
- Extend recipe list sort/filter UI.
- Implement plan page recent history panel.
- Add “Not made lately” and “Often cooked” trays.
- Implement `src/server/suggestions/simple.ts` and TRPC `getSuggestionsSimple`.
- Build `SuggestionCard.tsx` and integrate accept/replace.
- Add minimal unit/integration tests for scoring and endpoints.
