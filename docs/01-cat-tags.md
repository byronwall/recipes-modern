# Systems for Categories and Tags

## Status and remaining work

- [x] Database & Prisma: `Recipe.type` enum, `Tag`/`RecipeTag` models, indexes; migration applied; existing recipes default to `OTHER`.
- [x] Server API: `tagRouter` (`search`, `upsertByName`, `setTagsForRecipe`), extend `recipeRouter.list` with `type`, tag filters, `maxCookMins`.
- [x] UI — Create: New Recipe form has `Type` selector and `Tags` combobox; persists on create.
- [x] UI — Edit: Recipe page dialog supports updating `Type` and `Tags`; chips with remove.
- [x] UI — Browse: `RecipeList` has `Type` filter and `Tags` multi-select; calls updated API; shows selected as chips.
- [x] UI — Meal Planning: `PlanCard` shows recipe `Type` and top 1–2 tags.
- [ ] Data backfill (heuristic typing, optional seed tags)
- [ ] Need to be able to add new tags - edit especially

## Scope

- Database and Prisma

  - Add `Recipe.type` using an enum `RecipeType` with: BREAKFAST, LUNCH, DINNER, DESSERT, SNACK, DRINK, OTHER (default OTHER).
  - Introduce tagging via `Tag` and `RecipeTag` models (M:N) as defined below; add appropriate indexes.
  - Generate and apply Prisma migrations; backfill existing recipes with `type = OTHER`.

- Server API (tRPC)

  - Add a `tagRouter` with endpoints: `search`, `upsertByName`, `setTagsForRecipe`.
  - Extend `recipeRouter.list` to accept `type`, `includeTags`, `excludeTags` (AND semantics) and optional `maxCookMins`.

- UI — Create & Edit Recipes

  - New Recipe (`src/app/recipes/new/NewRecipeForm.tsx`): add a `Type` segmented control and a `Tags` combobox (search existing, create-on-enter); persist on create.
  - Edit Recipe (`src/app/recipes/[id]/RecipeClient.tsx`): add controls to view/update `Type` and `Tags`; wire to `setTagsForRecipe` and recipe update flow; display selected tags as removable chips.

- UI — Browse / Main Recipe List

  - `src/app/RecipeList.tsx`: add filter controls for `Type` (pill/segmented control) and `Tags` (multi-select combobox with search); reflect selection in query params (e.g., `?type=dinner&tags=italian,beef`).
  - Call the updated `recipeRouter.list` with the selected type/tags; show selected filters as chips with quick remove.

- UI — Meal Planning

  - `src/app/plan/PlanCard.tsx`: show the scheduled recipe’s `Type` badge and top 1–2 tag chips for quick scanning.

- Data migration/backfill (initial)

  - After migration, run a light backfill to set obvious types (optional heuristic) and optionally seed a small set of common tags.

- Out of scope (for this change)
  - Tag alias/merge UI, admin moderation, suggestion/ranking API, and analytics dashboards.

## Chat logs

Logs with an AI assistant about this feature. Use for inspo.

---

Hi,

> Great call: use an explicit **Recipe Type** (finite enum used by planners) plus a **free-form Tagging** system (user-extensible, faceting/search). Types drive scheduling rules; tags drive discovery, grouping, and suggestions.

### TL;DR comparison

| Dimension  | **Type (enum)**                                       | **Tags (free-form)**                                    |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------- |
| Examples   | breakfast, lunch, dinner, dessert, snack, drink       | italian, beef, kid-friendly, gluten-free, 30-min, grill |
| Governance | fixed list, versioned in code/seed                    | user-addable, mergeable, aliasable                      |
| UX role    | meal-planner filters, rotation rules, calendar badges | search facets, suggestions, collections, aisle grouping |
| DB shape   | single `recipe.type`                                  | M\:N `RecipeTag` join                                   |

---

### Proposed Prisma shape (minimal + scalable)

```prisma
// prisma/schema.prisma
enum RecipeType {
  BREAKFAST
  LUNCH
  DINNER
  DESSERT
  SNACK
  DRINK
  OTHER
}

model Recipe {
  id           String     @id @default(cuid())
  title        String
  // ...existing fields...
  type         RecipeType @default(OTHER)
  tags         RecipeTag[]
  // precomputed booleans you care about for fast faceting (optional)
  isVegetarian Boolean?   @default(false)
  cookMinutes  Int?
}

model Tag {
  id         String    @id @default(cuid())
  slug       String    @unique        // lowercased, hyphenated; canonical
  name       String    @unique
  aliases    String[]  @default([])   // optional: ["italian-food", "ita"]
  createdBy  String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  recipes    RecipeTag[]

  @@index([slug])
}

model RecipeTag {
  recipeId String
  tagId    String
  createdAt DateTime @default(now())

  recipe Recipe @relation(fields: [recipeId], references: [id])
  tag    Tag    @relation(fields: [tagId], references: [id])

  @@id([recipeId, tagId])
  @@index([tagId])
}
```

---

### Server surface (tRPC) — key endpoints

```ts
// server/routers/tag.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const tagRouter = createTRPCRouter({
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().min(0),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const q = input.q.trim().toLowerCase();
      const where = q
        ? {
            OR: [
              { slug: { contains: q } },
              { name: { contains: q, mode: "insensitive" } },
              { aliases: { has: q } },
            ],
          }
        : {};
      const tags = await ctx.db.tag.findMany({
        where,
        take: input.limit,
        orderBy: { name: "asc" },
      });
      console.log("[tag.search] q=%s count=%d", q, tags.length);
      return tags;
    }),

  upsertByName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(40) }))
    .mutation(async ({ ctx, input }) => {
      const slug = input.name.trim().toLowerCase().replace(/\s+/g, "-");
      console.log("[tag.upsertByName] name=%s slug=%s", input.name, slug);
      return ctx.db.tag.upsert({
        where: { slug },
        update: { name: input.name },
        create: { slug, name: input.name, createdBy: ctx.session.user.id },
      });
    }),

  setTagsForRecipe: protectedProcedure
    .input(z.object({ recipeId: z.string(), tagSlugs: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      console.log(
        "[tag.setTagsForRecipe] recipe=%s n=%d",
        input.recipeId,
        input.tagSlugs.length,
      );
      const tags = await ctx.db.tag.findMany({
        where: { slug: { in: input.tagSlugs } },
      });
      await ctx.db.recipeTag.deleteMany({
        where: { recipeId: input.recipeId },
      });
      await ctx.db.recipeTag.createMany({
        data: tags.map((t) => ({ recipeId: input.recipeId, tagId: t.id })),
        skipDuplicates: true,
      });
      return { ok: true, count: tags.length };
    }),
});
```

```ts
// server/routers/recipe.ts (excerpt)
export const recipeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(RecipeType).optional(),
        includeTags: z.array(z.string()).optional(), // slugs (AND semantics)
        excludeTags: z.array(z.string()).optional(),
        maxCookMins: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input?.type) where.type = input.type;
      if (input?.includeTags?.length) {
        where.tags = { some: { tag: { slug: { in: input.includeTags } } } };
      }
      if (input?.excludeTags?.length) {
        where.AND ??= [];
        where.AND.push({
          NOT: { tags: { some: { tag: { slug: { in: input.excludeTags } } } } },
        });
      }
      if (input?.maxCookMins) where.cookMinutes = { lte: input.maxCookMins };
      const recipes = await ctx.db.recipe.findMany({
        where,
        orderBy: { title: "asc" },
        include: { tags: { include: { tag: true } } },
      });
      console.log("[recipe.list] where=%o count=%d", where, recipes.length);
      return recipes;
    }),
});
```

---

### Meal-planning integration (how “type” + tags play)

- **Planner filters:** first filter by **`type`** (e.g., DINNER). Then facet by tags (`vegetarian`, `30-min`, `italian`).
- **Rotation rules (cooldowns):**

  - Don’t schedule the same **type** twice in a row (or within N days).
  - Don’t repeat the same **cuisine tag** within M days.
  - Bias toward **under 35 minutes** on weekdays (based on `cookMinutes` or tag `30-min`).

- **Suggestion API shape:**

  - input: `{ date, desiredType: RecipeType, includeTags?: string[], excludeTags?: string[], cooldownDays?: number }`
  - output: ranked list with reasons (`[{ id, score, reasons: ['DINNER match', 'not used 10d', 'has "30-min"'] }]`).

---

### UI (Next.js App Router + Radix) — Authoring & Browse

- **Recipe Editor**

  - `Type` as a segmented control (Breakfast/Lunch/Dinner/…).
  - `Tags` as a combobox with create-on-enter; show existing matches + “Create ‘beef’”.
  - Show inline **chips**; backspace to remove.

- **Browse + Faceted Search**

  - Top: `Type` pills for quick scope.
  - Left rail: tag facets with counts; AND semantics by default; a “chip cloud” when active.
  - Query params `?type=dinner&tags=italian,beef&max=35`.

- **Planner**

  - “Add recipe” dialog pre-filters by selected **type** for that day/time.
  - Smart suggestions section “Because it’s Tuesday dinner: … (30-min, not repeated cuisine)”.

---

### Data hygiene & governance (lightweight)

- **Normalization:** on create, slugify (`"Beef & Pork"` → `beef-pork`), lowercase, trim.
- **Aliases/merge:** allow admin to mark `aliases` on a canonical tag; search respects aliases.
- **Moderation:** soft-delete or merge tags (migrate `RecipeTag` rows; keep old slug → new slug redirect map).
- **Limits:** optional per-recipe tag cap (e.g., 12) to prevent tag spam.

---

### Backfill & migration (practical steps)

- Add `type` column with default `OTHER`, then run a one-time script to infer:

  - titles like `/cookie|brownie|cake/i` → `DESSERT`
  - “smoothie/latte” → `DRINK`
  - “salad/sandwich/soup” contextual → `LUNCH` or `DINNER` (manual review)

- Bootstrap common tags from your existing data (cuisine words, protein names).
- Build an **admin bulk-tagger** table view with quick chips and keyboard shortcuts.

---

### Analytics you’ll unlock

```sql
-- Most-used tags by type
SELECT r.type, t.name, COUNT(*) AS n
FROM "RecipeTag" rt
JOIN "Recipe" r ON r.id = rt."recipeId"
JOIN "Tag" t ON t.id = rt."tagId"
GROUP BY r.type, t.name
ORDER BY r.type, n DESC;

-- Planner diversity score (last 30 days): how often types repeat day-over-day
WITH days AS (
  SELECT date, r.type
  FROM "MealPlan" mp JOIN "Recipe" r ON r.id = mp."recipeId"
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT SUM(CASE WHEN type = LAG(type) OVER (ORDER BY date) THEN 1 ELSE 0 END) AS back_to_back
FROM days;
```

---

### Guardrails & perf

- **Indexes:** `RecipeTag(tagId)`, `RecipeTag(recipeId)`, `Tag(slug)`, `Recipe(type)`.
- **Facets perf:** if counts get heavy, materialize nightly (`TagUsage(tagId, count)`) or use a partial index.
- **Validation:** Zod constraints on tag length/charset; dedupe on save.

---

### Focused questions (so I can tailor the PR diff)

- Do you want my suggested **Type enum** as above, or different values (e.g., “Side”, “Appetizer”)?
- Should **users create tags** everywhere, or restrict create to the Recipe Editor (not in planner)?
- How should **AND vs OR** work for tag filters in browse? (Default AND is my rec.)
- Any **auto-tags** you want computed (e.g., `30-min` from `cookMinutes <= 30`, `vegetarian` from ingredient scan)?
- Should the planner enforce **cooldowns** hard (block selection) or soft (warn + allow)?
- Do you want **per-user private tags** (e.g., “Dad-preferred”) or all tags global?

---

### 9 likely improvements to ship with this change

- **Saved Searches:** persist `{type, tags, maxCookMins}` as named filters (“Weeknight Italian”).
- **Calendar Badges:** show the recipe’s `type` + top 1–2 tags on each planner tile for quick scanning.
- **Suggestion Reasoning:** in the “Suggested for Tuesday Dinner” list, show the rules that matched (trust-building).
- **Tag Pages:** `/tag/italian` landing with hero, featured recipes, and related tags (co-occurrence).
- **Pantry-Aware Suggestions:** if you later track pantry, boost recipes whose tags match pantry staples (`beans`, `rice`).
- **Aisle Grouping:** map certain tags (`produce`, `dairy`, `bakery`) to shopping-list groups; collapse/expand by group.
- **Import Helpers:** simple CSV import of tags for existing recipes (bulk backfill).
- **Alias/Redirect UI:** admin tool to merge tags and set `aliases`, with a redirect from old slug.
- **Heatmaps:** planner heatmap by `type` to visualize balance (e.g., too many desserts? impossible! 😄).

If this direction looks right, I can sketch the **migration script**, a **Tag Combobox** component (Radix), and the **Suggestion API** with scoring next.
