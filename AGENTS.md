# AGENTS.md — Repo Patterns & Conventions

This file documents the key UI and code patterns established in this repo. It should be used by agents making future changes to keep work consistent.

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

## Modals

- **Edit modal layout**: Two‑column grid layout with clear field groupings.
- **Type pills**: Use chip-style selectors with hidden radio dots (`sr-only`).
- **Name input**: Slightly larger than other inputs (`h-12 text-base`).

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
- **`RecipeTagEditor`**: Shared add/remove tag UI with optional overflow and confirm remove; use for list + detail tags.
- **`InlineTagEditor`**: Form-focused tag input used inside dialogs/edit modals.
- **`ListPanel`**: Reusable popover list container with matching item + empty-state components.
- **`PageHeaderCard`**: Standard header card surface for page-level titles/controls.
- **`CardGrid`**: Shared grid container for card layouts.
- **`RecipeMetaInline`**: Inline metadata editor for cook time, type, and tags on recipe detail.

## Recommended Utilities

- If adding repeated action patterns, create a shared `TooltipButton`.
- If adding new layouts, consider shared `PageHeaderCard` and `CardGrid` components.
