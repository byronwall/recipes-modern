# UI Design Guidelines

These guidelines capture the design goals and patterns established during recent layout improvements. Use them as the baseline for future UI work to keep the experience cohesive, modern, and easy to scan.

## Core Principles

- **Tight, readable layout**: Favor compact spacing, predictable alignment, and balanced density. Avoid excessive vertical gaps that make screens feel sparse or disjointed.
- **Surface hierarchy**: Use subtle card surfaces and borders to separate functional regions. Keep contrast soft and consistent.
- **Frictionless actions**: Make core actions prominent but not overwhelming. Use icons where density matters; use text where clarity matters.
- **Editable where it matters**: For “working” screens, allow light‑touch edits inline. Reserve full forms for deep edits.
- **Consistency across pages**: Controls, chips, and buttons should look and behave the same across list and detail views.

## Navigation

- **No underlines**: Remove underline styling from the main nav; it reads as noisy and outdated.
- **Pill navigation**: Use rounded pills for nav items. Active item is a filled pill with inverted text.
- **Smaller type**: Reduce nav font size to a restrained, confident scale.
- **Sign out**: Style sign out as a subtle pill action to blend with nav.

## Page Layout

- **Header cards**: Use a subtle card for page headers that contain title + primary controls (e.g., filters, toggles).
- **Grid alignment**: Align controls to top edges and keep labels on a consistent baseline.
- **Consistent card sizing**: Cards should share min-height and anchor footers to align action rows across columns.
- **Vertical rhythm**: Use consistent padding values for card headers, bodies, and footers.

## Controls & Filters

- **Unified filter bars**: Group search + filters into a single card. Avoid scattered controls.
- **Label placement**: Use small uppercase labels above controls to establish structure.
- **Clear actions**: Use “Clear all” only when filters are active, and keep it visually quiet.
- **Compact selectors**: Keep filter chips and toggles compact and evenly spaced.

## Recipe Cards (Index)

- **Card grid**: Prefer a responsive grid with clean card surfaces and soft shadows on hover.
- **Open via title**: Use the recipe name as the entry point; avoid redundant “Open” buttons.
- **Action density**: Use icon-only buttons with tooltips on index cards to keep density high.
- **Tag overflow**: Show first 1–2 tags and collapse the rest into a “+N more” tooltip.

## Recipe Detail

- **Header composition**: Title, description, time/type/tags grouped tightly, actions aligned top-right.
- **Action panel**: Use a right-side action column separated by a subtle left border (no boxed card).
- **Inline editing**: Time, type, and tags should be editable inline in the detail view.
- **Action variants**: Use text buttons in the detail view (`variant="full"`), icon-only on cards (`variant="compact"`).

## Tag + Type Styling

- **Type chips**: Use pill-style selectors and in-place `Select` controls to keep type editing light.
- **Tag chips**: Use a distinct background tint (e.g., accent) to differentiate tags from type/time chips.
- **Tag controls**: Tag selection should not feel modal-heavy. Prefer inline input and compact dropdowns.

## Modals

- **Edit modal layout**: Use a two‑column grid with generous spacing and clear groupings.
- **Type selector**: Present type options as pill chips (no visible radio dots).
- **Input hierarchy**: Name field should be visually larger than other inputs.
- **Inline tag input**: Always show the tag input with a small dropdown trigger. Avoid jarring modal launches.

## Plan Page

- **Consistent cards**: Plan cards should align vertically with identical header and footer heights.
- **Footer actions**: Footer actions should sit on a border-top baseline, aligned across cards.
- **Minimal metadata**: Keep card metadata tight—type only. Avoid tag stacks in plan listing.
- **Tooltips on actions**: All icon buttons should have tooltips.
- **Add meal popover**: Popover should open to the left and use a tidy list with hover feedback.

## Buttons & Tooltips

- **Icon spacing**: Always provide a small gap between icon and label (`ml-1`).
- **No icon shrink**: Icons should never compress; apply `shrink-0`.
- **Tooltip usage**: Always use the tooltip component; never use `title` attributes.

## Spacing & Alignment Cheatsheet

- **Card padding**: 12–16px inside small cards; 20–24px for page-level cards.
- **Footer bars**: Use top border + small padding to anchor actions.
- **Grid ratios**: For split content (ingredients/instructions), use ~40/60.

## Visual Tone

- **Soft contrast**: Prefer muted backgrounds, subtle borders, and moderate shadows.
- **Quiet labels**: Labels should be uppercase, small, and muted.
- **Focus on hierarchy**: The layout should guide the eye from title → metadata → actions → content.
