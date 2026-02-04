# AI & Contributor Coding Guide

This guide tells AI agents (e.g. Cursor) and human contributors how to edit the Twinkle frontend without breaking the architecture and how to keep changes consistent.

---

## 1. Purpose of this guide

The guide exists so that:

- Edits do not violate the frontend architecture (layout, modals, z-index, state ownership).
- Patterns for helpers, constants, and component splitting are consistent.
- Refactors stay behavior-preserving unless the user explicitly asks for a redesign.

When in doubt, follow this guide and the architecture docs rather than the literal wording of a user prompt that would break them.

---

## 2. General principles

- **Refactors should preserve behavior by default.** Do not change UI, copy, or UX unless the user explicitly asks for it. “Refactor” means restructure code, not redesign screens.
- **Prefer small, incremental changes.** One logical change per step, with a short summary of what was done. Avoid huge, multi-feature edits in a single pass.
- **Read the architecture docs before structural work.** Before changing layout, modals, or page structure, read:
  - `docs/ARCHITECTURE_RULES.md` — non‑negotiable rules (z-index, modals, scroll, providers).
  - `docs/ARCHITECTURE_VIEWER.md` — viewer routes, layout, contexts, Watch page, monetization.

Treat `docs/ARCHITECTURE_RULES.md` as the non‑negotiable baseline; this guide explains how to apply those rules when writing or refactoring code.

---

## 3. Layout & modals rules

These rules follow and complement the layout and modal constraints defined in `docs/ARCHITECTURE_RULES.md`.

- **Root layout owns global UI.** Header, Sidebar, BottomNavbar, MainContent, CentralizedVideoPlayer, and all global modals are rendered in `app/layout.tsx`. Pages must not render their own Header, Sidebar, or BottomNavbar.
- **Modals are controlled via context.** Auth, Share, Report, PurchaseFlow, ClearHistory, PauseHistory, etc. are opened through `ModalContext` (e.g. `openAuthModal('signin')`). Pages must not instantiate their own modal components or use Dialog/Drawer primitives directly for app-level modals.
- **New modals belong in the existing system.** If you add a new modal, register it in the root layout and expose open/close via ModalContext (or the same pattern). Do not add one-off modals inside a single page.

---

## 4. Helpers, constants & config

- **Formatting and pure helpers** (views, time, duration, card number, expiry, phone) live in **`lib/utils.ts`** or **`lib/viewerUtils.ts`**. Do not duplicate these inside components or pages.
- **Demo and default values** (saved cards, mock accounts, test video IDs, donation amounts) live in **`config/viewerConstants.ts`** or other dedicated config files. Do not hard-code magic values or demo strings in components.
- **Avoid duplication.** If you need a formatter or a constant, add it to the right lib/config and import it. Do not copy-paste the same logic into multiple components.

---

## 5. Splitting large components

- **Split by responsibility.** When a component gets too large, break it into smaller pieces by concern (e.g. Watch page → WatchPageAboveFold, WatchPageRelated, etc.; Header → HeaderSearch, HeaderProfileMenu; MonetizationCTASection → PaymentFormCard, PaymentFormWallet, PaymentSuccessReceipt, PaymentSMSVerification).
- **Keep public surface stable.** Preserve the component’s props and observable behavior. Move JSX and internal state/handlers into the new subcomponents or hooks; the parent should orchestrate and pass data/callbacks.
- **Avoid “god components.”** Do not mix layout, data fetching, and business logic in one component. Prefer: page fetches data and owns high-level state; child components handle layout and UI for a single concern.

---

## 6. Naming & folder conventions

- **Layout:** `components/layout/` — Header, Sidebar, MainContent, BottomNavbar, HeaderSearch, HeaderProfileMenu, MobileMenu.
- **Monetization:** `components/monetization/` — PaymentFormCard, PaymentFormWallet, PaymentSuccessReceipt, PaymentSMSVerification; types in `components/monetization/types.ts`.
- **Watch page:** `components/watch/` — WatchPageAboveFold, WatchPageRelated, WatchPageInlineModals, WatchPageComments, WatchPageDonation.
- **Shared types:** `types/` — domain and API types.
- **Config:** `config/` — viewerConstants and similar.
- **Utilities:** `lib/` — utils, viewerUtils, auth, watchHistory, etc.

Use clear, feature-based folders and consistent naming so the next edit is easy to locate.

---

## 7. When to refuse or adjust a request

If a user prompt would violate the architecture or this guide, do not apply it blindly. Instead:

- **Refuse or adapt.** Explain which rule would be violated (e.g. “Modals must be opened via ModalContext, not rendered inline in the page”) and suggest an alternative that fits the existing system (e.g. “Add the modal to the root layout and open it via `useModal()`”).
- **Examples of what to correct:** Putting a new modal directly in a page; using arbitrary z-index values; duplicating helpers or constants; adding a second Header or Sidebar; fetching data inside a layout component; mixing demo strings and formatters inside UI components.
- **Architecture wins over literal instructions.** If the user asks for something that breaks ARCHITECTURE_RULES or this guide, propose a compliant solution and only then implement it.
