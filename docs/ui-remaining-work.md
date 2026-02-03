# UI Remaining Work Inventory

This document lists pages and components that have **not** yet received the recent layout/visual improvements. It’s intended as a backlog for applying the updated design language (card surfaces, compact controls, tooltips, inline editing, and tighter alignment).

## Pages Not Yet Updated

### Auth

- `src/app/auth/page.tsx`
- `src/app/auth/LoginForm.tsx`
  **Notes:** Likely still uses older input spacing and button styles. Should adopt the new card layout and pill‑style controls.

### Shopping List

- `src/app/list/page.tsx`
- `src/app/list/ShoppingList.tsx`
- `src/app/list/ShoppingListCard.tsx`
- `src/app/list/ShoppingRecipeItem.tsx`
- `src/app/list/ShoppingAddLoose.tsx`
- `src/app/list/AislePickerDialog.tsx`
- `src/app/list/KrogerSearchPopup.tsx`
- `src/app/list/KrogerItemDisplay.tsx`
  **Notes:** This section is still using older table/list styling. Should align with the updated card system and action/tooltips.

### Purchases

- `src/app/purchases/page.tsx`
- `src/app/purchases/PurchasesList.tsx`
  **Notes:** The purchases list is currently a basic list view. Should be refactored into cards with tighter spacing and consistent typography.

### Kroger

- `src/app/kroger/page.tsx`
- `src/app/kroger/UserKrogerStatus.tsx`
- `src/app/kroger/auth/route.ts` (UI-related messaging)
  **Notes:** Authentication status UI still looks utility‑style. Needs a more intentional layout with cards and clear status badges.

### AI Recipe Generator

- `src/app/ai/recipe/page.tsx`
- `src/app/ai/layout.tsx`
  **Notes:** AI flow has its own layout and doesn’t yet match the rest of the app’s new visual language.

### Touch-up Flow

- `src/app/recipes/[id]/touch-up/page.tsx`
- `src/app/recipes/[id]/touch-up/touchup-client.tsx`
  **Notes:** The AI touch-up interface likely still uses older form spacing and button styles. Should align with updated modal + card conventions.

## Components Not Yet Updated

### Recipe Creation

- `src/app/recipes/new/NewRecipeDialog.tsx`
- `src/app/recipes/new/NewRecipeForm.tsx`
  **Notes:** Should inherit the updated edit modal styling and layout rhythm.

### Cooking Mode / Timers

- `src/app/recipes/[id]/CookingModeOverlay.tsx`
- `src/app/recipes/[id]/TimerZone.tsx`
- `src/app/recipes/[id]/Timer.tsx`
  **Notes:** These overlays likely still use older control patterns and spacing.

### Global Components

- `src/components/SimpleAlertDialog.tsx` (styling could be updated)
- `src/components/ImageLightbox.tsx`
- `src/components/GlobalAddTagDialog.tsx`
  **Notes:** These are utility components but should be checked for consistency with updated styles.

### Miscellaneous

- `src/app/MigrateButtons.tsx`
- `src/app/TailwindIndicator.tsx`
  **Notes:** These are dev/utility components. Optional to update depending on priority.

## Next Suggested Workstreams

1. **Shopping List Section**
   - Modernize list cards, add tooltips, and unify action buttons.
2. **AI + Touch-up Flows**
   - Align to the new card/modal language.
3. **Auth Page**
   - Update layout and spacing for first‑run consistency.
4. **Kroger + Purchases**
   - Normalize content into a card-based layout.

## Validation Checklist (When Updating Each Page)

- Card surfaces with consistent radius/padding.
- Compact controls with aligned labels.
- Tooltips for icon actions.
- Unified typography and chip styles.
- Consistent spacing and grid alignment.
