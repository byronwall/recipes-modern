# UI Review Notes & Recommendations

## Summary

Recent UI work significantly improved layout clarity, control density, and visual consistency across recipes, detail, and plan pages. The new patterns (card surfaces, inline edit controls, compact action bars, tooltips) are solid, but the implementation has started to fragment across components. There are a few opportunities to reduce duplication and make future changes less brittle.

This document flags key refactor opportunities, large components, and layout patterns that should be extracted into reusable pieces.

---

## Key Findings

### 1. Layout patterns are repeated without an abstraction

**Files:**

- `src/app/RecipeList.tsx`
- `src/app/recipes/[id]/RecipeClient.tsx`
- `src/app/plan/PlanPageClient.tsx`

**Issue:**

- Each page builds its own “header card + controls + grid” layout.
- No common wrapper or layout component; spacing can diverge quickly.

**Recommendation:**

- Introduce `PageHeaderCard` and `CardGrid` components in `src/components/layout/`.
- Use them across recipe list, detail, and plan pages.

**Benefit:**

- Reduces layout drift and makes future UI refinements easier.

---

### 2. Recipe actions vary by view but use prop branching

**File:** `src/app/recipes/[id]/RecipeActions.tsx`

**Issue:**

- Component handles `compact` and `full` layouts with multiple branches and mixed UI responsibilities.
- Adds to component complexity and makes it harder to style.

**Recommendation:**

- Split into `RecipeActionsCompact` and `RecipeActionsFull` components.
- Leave shared logic in a `useRecipeActions` hook or shared helper.

**Benefit:**

- Cleaner rendering logic, easier styling changes per view.

---

### 3. Inline metadata editing on detail page could be reusable

**File:** `src/app/recipes/[id]/RecipeClient.tsx`

**Issue:**

- Inline type and tags editing is now embedded directly in `RecipeClient`.

**Recommendation:**

- Extract a `RecipeMetaInline` component to share between detail page and potential future layouts.
- Include support for `cookMinutes`, `type`, and tags.

**Benefit:**

- Makes it simpler to reuse or move metadata editing without re‑implementing.

---

### 4. Plan cards are consistent but rely on fixed min-heights

**File:** `src/app/plan/PlanCard.tsx`

**Issue:**

- Vertical alignment uses `min-h` values and fixed structures.
- This works visually but might break with longer titles.

**Recommendation:**

- Consider a two-line clamp for titles (`line-clamp-2`) to guarantee consistent height.
- If titles are longer, force truncation to keep rows aligned.

**Benefit:**

- Predictable alignment without relying on hardcoded heights.

---

## Code Hygiene & DRY Opportunities

### Suggested component extractions

- `TagChip` (for selected tags, variant for type vs. tag)
- `PageHeaderCard`
- `ActionBar`
- `RecipeMetaInline`

### Suggested hooks/helpers

- `useInlineTagEditor` (centralize add/remove/upsert logic)
- `useRecipeMetaUpdates` (type, cook time, tags)

---

## Recommendations by Priority

### Medium Priority

1. **Create layout wrappers** (header card, grid).
2. **Create `RecipeMetaInline` for reuse**.

### Low Priority

1. **Clamp plan card titles**.
2. **Refine popover list components** into reusable list panels.

---

## Final Note

The UI direction is strong: compact, calm, and intentionally structured. The main risk now is **divergence** as more pages adopt similar patterns. Extracting 3–5 small reusable components will preserve consistency and keep momentum high.
