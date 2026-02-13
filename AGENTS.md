# AGENTS.md — Repo Patterns & Conventions

This file documents the key UI and code patterns established in this repo. It should be used by agents making future changes to keep work consistent.

## Product Scope

- **Kroger-focused app**: This site is dedicated to Kroger API workflows for purchase history, product search, and add-to-cart operations.
- **Search flow**: Prefer the built-in Kroger search modal for product discovery inside the app.
- **Product links**: Product names in Kroger-backed UIs should link out to the Kroger product page.

## UI Layout Patterns

- **Card surfaces**: Use rounded cards (`rounded-2xl`) with subtle borders and `bg-card/70` or `bg-background/80`.
- **Header cards**: Page headers live inside a card with title + controls; use upper‑case labels for grouping.
- **Action panels**: For detail pages, actions live in a right column with a subtle left border (not a boxed card).
- **Grids**: Use responsive grids to align cards; keep min-heights consistent to align footers.

## Buttons & Actions

- **Icon buttons**: Use `size="icon"` and always wrap with tooltips when icon‑only.
- **Text buttons**: Use for detail pages (more space). Use icon + label with a small gap (`ml-1`).
- **Icons**: Always set `shrink-0` on icons to avoid squeezing.
- **Tooltips**: Must use `Tooltip` components; no `title` attributes.

## Tags & Type

- **Type selector**: Use the same `Select` control from the recipes index (compact pill trigger).
- **Tag chips**: Use a distinct background tint (e.g., `bg-accent/60`) to separate from type/time chips.
- **Tag overflow**: In dense lists, show first 1–2 tags + “+N more” tooltip.
- **Inline editing**: On detail pages, tags/type should be editable without opening modals.

## Recipe Detail

- **Metadata order**: Time → Type → Tags.
- **Editable metadata**: Use the same inline `Select` + tag add/remove behavior as the index view.
- **Title underline**: Remove underline from H2 when used as recipe title.

## Recipe Content Editing (Ingredients + Steps)

- **Single editing flow**: Treat ingredients and steps as one unified edit mode with one shared save lifecycle.
- **Edit entry points**: In read mode, place a subtle icon-only pencil button in the top-right of both ingredients and instructions cards; both should open the same edit mode.
- **Read-mode section headers**: Keep read-mode `ingredients`/`instructions` headings more subtle (smaller + muted) than edit-mode headings.
- **Edit-mode actions**: Show Save/Cancel at both top-right and bottom-right of the edit screen; both rows trigger the same handlers.
- **Dirty cancel protection**: If there are unsaved edits, Cancel and `Escape` should open a confirmation dialog before leaving edit mode.
- **Inner edit surfaces**: Avoid nested “card-in-card” chrome in edit mode. Prefer borderless inner sections that fill the outer card.
- **Grouped content layout**: For ingredient/step groups, use spacing and background tint over heavy borders. Keep groups visually separated but compact.
- **Group title row**: Title input and group delete icon should sit on the same row with tight spacing.
- **Title input width**: Group title inputs should size to content (`ch`-based width) and grow as text grows, rather than spanning full width.
- **Input affordance**: Editable fields should have subtle hover/focus purple tint (`bg-primary/10`) to indicate editability.
- **Dirty field styling**: Dirty fields should get a subtle purple border and light bottom shadow (not a heavy glow).
- **Ingredient advanced fields**: Only show the `Show advanced` toggle when amount/unit/modifier data is absent; hide the toggle once advanced data exists.
- **Insert between steps**: Support inserting a step between existing rows with subtle inline `+` controls.
  - Position these controls absolutely so they do not increase row spacing.
  - Keep them visually close to the step number chip.
- **Auto-focus on add/insert**: After adding an ingredient/step or inserting a step between rows, focus the new input/textarea automatically.
- **List indentation**: Keep list content (table/rows and per-group add button) slightly indented from group titles for hierarchy.

## Modals

- **Edit modal layout**: Two‑column grid layout with clear field groupings.
- **Type pills**: Use chip-style selectors with hidden radio dots (`sr-only`).
- **Name input**: Slightly larger than other inputs (`h-12 text-base`).
- **Controlled-open search modals**: When opened programmatically (e.g., from hover cards), trigger the initial search immediately.
- **Auto-search safety**: Guard controlled-open auto-search effects so they run once per open/query and do not create update loops.
- **Search modal hierarchy**: Prefer the search input as the primary header element; remove redundant title text when the query context is already clear.
- **Border restraint in search UIs**: Avoid nested bordered wrappers around input + button rows; keep one clear surface to reduce visual noise.
- **No-results feedback**: Empty states should explicitly say no results were found and include the searched term when available.

## Pricing Display

- **Unit vs total clarity**: In compact chips, label price and quantity explicitly (e.g., `$/ea` and `N total`) rather than ambiguous values like plain price + `Qty N`.

## Plan Page

- **Plan cards**: Card height should align across grid using min-heights; footer actions anchored with `mt-auto`.
- **No tags in plan listing**: Only show type + made status.
- **Add meal popover**: Opens to the left, with a tidy list and hover states.

## Navigation

- **Nav items**: Rounded pills. Active item is filled pill with inverted text. No underlines.
- **Sizing**: Keep nav typography restrained (`text-base`/`text-lg`).

## Component Responsibilities

- Avoid overloading single files. Split large components (e.g., recipe detail) into subcomponents:
  - Header + metadata
  - Actions panel
  - Edit modal
  - Images section
  - Tag editor

## File Locations

- Layout components: `src/components/`
- Page-level UI: `src/app/<route>/`
- Shared UI primitives: `src/components/ui/`

## Common Components

- **`TooltipButton`**: Wraps tooltip + trigger with standard delay; use for icon-only buttons instead of repeating `TooltipProvider`.
- **`IconTextButton`**: Standard icon + label spacing with `shrink-0` icons.
- **`EditModeActionButtons`**: Shared Save/Cancel action row used in recipe content edit mode (top and bottom placements).
- **`DiscardChangesDialog`**: Shared confirm dialog for unsaved edit cancellation.
- **`RecipeTagEditor`**: Shared add/remove tag UI with optional overflow and confirm remove; use for list + detail tags.
- **`InlineTagEditor`**: Form-focused tag input used inside dialogs/edit modals.
- **`ListPanel`**: Reusable popover list container with matching item + empty-state components.
- **`PageHeaderCard`**: Standard header card surface for page-level titles/controls.
- **`CardGrid`**: Shared grid container for card layouts.
- **`RecipeMetaInline`**: Inline metadata editor for cook time, type, and tags on recipe detail.

## UI Goals

- **Compact, readable layout**: Favor tight spacing and aligned baselines; avoid overly airy screens.
- **Soft surface hierarchy**: Subtle card surfaces and borders; keep contrast calm.
- **Action clarity by context**: Icon-only actions for dense lists; text actions for detail views.
- **Inline edits for working screens**: Keep tags, type, and time editable in place when practical.
- **Consistency over novelty**: Reuse established chips, tooltips, and card patterns across pages.

## Recommended Utilities

- If adding repeated action patterns, create a shared `TooltipButton`.
- If adding new layouts, consider shared `PageHeaderCard` and `CardGrid` components.
- Use `dirtyInputClass` (recipe detail edit utility) for consistent dirty-field border/shadow styling.

## Logging & Diagnostics

- **Structural flow logging (dev-only)**: When debugging, add logs at key structural boundaries (route entry, service/mutation start/end, external API call, and error branches) so end-to-end flow is traceable.
- **No env dumps**: Never log full `process.env` or secrets/tokens/credentials. If config visibility is needed, log only minimal non-sensitive derived values.
- **Cleanup expectation**: Remove temporary debug logs once development/verification is complete; keep only intentional operational logs that provide ongoing production value.
