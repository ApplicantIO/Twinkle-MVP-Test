# Refactoring Levels

This document explains how we use “Level 1 / Level 2 / Level 3” to scope refactors in Twinkle and what has been done so far.

---

## 1. Introduction

We use level labels so refactors stay **focused** and **safe**: each level has a clear goal and scope. That way we avoid “big bang” rewrites and keep the product stable while improving structure. When planning a refactor, we assign it a level and keep the change within that scope—no mixing cleanup with new features or redesigns.

---

## 2. Level 1 – Cleanup & consistency

Level 1 aimed to make the codebase **consistent and safe to extend** without changing UX.

- **Navigation** — Fixed dead links and added placeholder pages where routes would otherwise 404.
- **Formatting helpers** — Centralized view counts, time/duration, and similar formatters in `lib/utils.ts` so components don’t duplicate logic.
- **Demo and constants** — Moved demo values and shared constants (priority video IDs, donation amounts, default saved cards, mock account) into `config/viewerConstants.ts` instead of scattering them in components.
- **Z-index** — Replaced arbitrary `z-[...]` values with the design-system scale (L0–L5) and added `npm run check:z-index` to enforce it. See `docs/ARCHITECTURE_RULES.md`.
- **AuthModal** — Moved AuthModal into the root layout and wired it to `ModalContext`; Sign In / Sign Up in the Header now open it via `openAuthModal('signin' | 'signup')` instead of page-level modals.

**Goal:** One source of truth for helpers and constants, predictable layout and modals, and no UX changes—only a cleaner base for future work. Level 1 changes must never alter visible behavior; if UI or copy needs to change, that belongs to a separate feature task, not a Level 1 refactor.

---

## 3. Level 2 – Structural refactors

Level 2 focused on **splitting large components** by responsibility while keeping behavior identical.

- **Watch page** — The watch page was split into section components: `WatchPageAboveFold` (player, title, actions, description), `WatchPageRelated` (related videos), `WatchPageInlineModals` (share/report/notifications), `WatchPageComments` (comments and donations area), `WatchPageDonation` (donation flow). The page still owns data loading and high-level state; sections own layout and UI.
- **Header** — The main Header was split into `HeaderSearch` (search input, history, suggestions dropdown) and `HeaderProfileMenu` (avatar, profile dropdown, settings when logged out). Header now focuses on layout and wiring; search and profile state live in the subcomponents.
- **MonetizationCTASection** — The paywall block was split into: `PaymentFormCard`, `PaymentFormWallet`, `PaymentSuccessReceipt`, `PaymentSMSVerification`, plus shared formatting/validation in `lib/viewerUtils.ts`. MonetizationCTASection orchestrates (free vs paid vs subscription) and delegates to these components; demo config stays in `config/viewerConstants.ts`.

**Goal:** Smaller, single-responsibility components and shared utilities so we can add features or swap implementations (e.g. real payments) without touching huge files. No behavior or UX change—pure structure.

---

## 4. Level 3 – Future polish

Level 3 is **not done yet**. It is for later, when the product is stable and we want more polish.

Possible areas (to be decided when we get there):

- **Unified VideoCard** — Reuse a single VideoCard (or a small set of variants) across Home, Search, Related, History, etc., instead of ad-hoc cards per page.
- **Design system cleanup** — Buttons, inputs, spacing, and tokens in one place; remove drift between pages.
- **Studio / Creator-side architecture** — Document and optionally refactor Creator and Studio routes and components (separate from viewer docs).
- **Tests** — Unit or integration tests for critical paths (auth, purchase flow, watch history).

Level 3 should be done **when the product needs polish and maintainability**, not before core features work end-to-end. It is optional and can be broken into smaller initiatives.

---

## 5. How to use this document

Before starting a **larger refactor**:

1. **Read this file** and `docs/ARCHITECTURE_RULES.md` / `docs/ARCHITECTURE_VIEWER.md` so you know what each level means and what’s already in place.
2. **Decide which level** your change belongs to: cleanup and consistency (Level 1), structural split without behavior change (Level 2), or future polish (Level 3).
3. **Keep the change scoped** to that level—don’t mix cleanup with new features or redesigns. If the scope grows, split it into separate steps and label them by level.

That way refactors stay predictable and the product stays stable.
