---
name: twinkle-ui-layout
description: UI and layout guidelines for Twinkle. Use when editing React in app/ or components/ — z-index, layout ownership, scroll and modals, small surgical changes, reuse primitives.
---

# Twinkle UI & Layout

Use this skill when editing React in `app/` or `components/` in Twinkle-MVP-Test.

## When to use

- Editing React components under `app/` or `components/`.

## Must follow

- **docs/ARCHITECTURE_RULES.md** — z-index scale, layout ownership, scroll rules, modal system.
- **Z-index:** Use the project z-index scale only; no arbitrary `z-[...]`.
- **Layout ownership:** Root layout owns Header, Sidebar, MainContent, modals; pages must not override or duplicate.
- **Scroll and modals:** Follow existing scroll and modal rules; modals via context, not page-level.

## Do

- Small, surgical UI changes.
- Component extraction instead of full-page rewrites.
- Reuse existing primitives (buttons, modals, layout, typography).
- Keep Tailwind usage consistent with nearby code.

## Don't

- Root layout hacks or global scroll overrides to fix a single page.
- Duplicated helpers — use `lib/utils.ts`, `lib/viewerUtils.ts`, `config/viewerConstants.ts`.

## Large UI changes

- Propose an incremental plan.
- Implement only a minimal first slice unless the user clearly approves more.
