# Viewer Architecture

This document describes the viewer-side structure of Twinkle: routes, layout, contexts, and main UI components. It reflects the current codebase after the Watch page, Header, and Monetization refactors.

---

## 1. Viewer routes overview

The app is a Next.js single application. Viewer-facing routes live under `app/`:

- **`/`** — Home: video feed (uses priority/demo video IDs from config).
- **`/watch/[id]`** — Watch page: video player, metadata, related videos, comments, donations, and paywall when content is paid or subscription.
- **`/search`** — Search results (query from URL); search input and suggestions live in the Header.
- **`/history`** — Watch history (DB for logged-in users, localStorage for guests); supports clear and pause-history modals.
- **`/creator/[id]`** — Public creator/channel page.
- **`/playlist/[id]`** — Playlist page; can show `MonetizationCTASection` for paid playlists.
- **`/profile`** — User profile (authenticated).
- **`/library`**, **`/saved`**, **`/subscriptions`** — Library and subscription surfaces.
- **`/auth/signup`** — Sign-up page; auth is also available via the global AuthModal (Header “Sign In” / “Sign Up”).
- **`/feedback`**, **`/help`** — Linked from Header profile/settings menus.

Some of these routes (e.g. profile, library, saved, subscriptions, feedback, help) currently render minimal placeholder pages (“Coming soon”) until full features are implemented.

Creator and Studio routes (`/studio`, `/studio/upload`, `/studio/content`, `/studio/settings`, `/dashboard`, etc.) are part of the same app but are not covered here; they will be documented separately.

---

## 2. Root layout & global UI

The root layout (`app/layout.tsx`) wraps the app in a fixed provider order, then renders global UI and the main content slot:

- **Providers (outer to inner):** `AuthProvider` → `PurchaseProvider` → `SidebarProvider` → `MiniplayerProvider` → `ModalProvider`. This order must not change (see `docs/ARCHITECTURE_RULES.md`).

- **Global UI (inside `ModalProvider`):**
  - **Header** — Fixed top bar: logo, sidebar toggle, **HeaderSearch** (search input + suggestions dropdown), Sign In / Sign Up when logged out, **HeaderProfileMenu** (avatar + dropdown when logged in, or settings gear when logged out). Header composes `HeaderSearch` and `HeaderProfileMenu`; it does not own search or profile state.
  - **Sidebar** — Desktop nav drawer; collapse state from `SidebarContext`. Route-agnostic.
  - **MainContent** — Wraps `{children}` (page content); owns the main scroll area except where the Watch page has its own scroll behavior.
  - **BottomNavbar** — Mobile bottom navigation.
  - **CentralizedVideoPlayer** — Global video/miniplayer instance (miniplayer is shown via portal when applicable).
  - **Modals** — ShareModal, ReportModal, PurchaseFlowModal, AuthModal (via AuthModalWrapper), ClearHistoryModal, PauseHistoryModal. All are rendered in the layout and opened via `ModalContext` (e.g. `openAuthModal('signin')`); pages do not render their own modals.

Pages render inside `MainContent` and must not render Header, Sidebar, or BottomNavbar.

---

## 3. Contexts & data flow

- **AuthContext** — Current user (or null), login/logout. Used by Header (profile vs Sign In/Up), Watch page, and any feature that needs auth.
- **ModalContext** — Open/close global modals (e.g. `openAuthModal('signin' | 'signup')`). Header auth buttons and profile flows use this.
- **SidebarContext** — Sidebar open/collapsed; Header toggle and Sidebar read/write it.
- **MiniplayerContext** — Global video state for miniplayer; Watch and other pages can trigger miniplayer via context.
- **PurchaseContext** — Purchase/subscription state used by the purchase flow and paywall.

**Data flow:** Auth state drives Header (profile menu vs auth buttons) and protected features. Purchase state is used when the user hits paid or subscription content; `MonetizationCTASection` and purchase modals rely on it. Pages fetch their own data (e.g. video by id, history, search) via `fetch` to `/api/*`; the contexts above provide global session and UI state, not page-level data.

---

## 4. Watch page architecture

The Watch page (`app/watch/[id]/page.tsx`) loads the video (and related data), then delegates layout and UI to section components. The page owns data loading and high-level state; each section owns its slice of layout and interaction.

- **WatchPageAboveFold** — Player area, title, actions (like, share, etc.), description, and on mobile the monetization CTA when content is locked. Handles teaser vs full video and paid vs free display.
- **WatchPageRelated** — “Recommended” or related videos list beside (or below) the main content.
- **WatchPageInlineModals** — In-page triggers for share, report, and notifications from the watch UI. These triggers use the existing global modal system (ModalContext) instead of creating their own standalone modals.
- **WatchPageComments** — Owns the right-column layout (header, tabs, body, footer) for the comments/donations area. Most of the comments and donation content is passed in from the page as props or children; this section coordinates with donation config (e.g. from `viewerConstants`).
- **WatchPageDonation** — Focuses on the donation header and layout; used by WatchPageComments or the page when the donation view is active.

The page passes props (video, callbacks, visibility flags) into these sections. Section components do not fetch the main video; they receive what they need from the page.

---

## 5. Monetization & viewer helpers

**MonetizationCTASection** (`components/MonetizationCTASection.tsx`) is the paywall orchestrator. It decides whether content is free, paid, or subscription and shows the right CTA and flow. It owns the high-level payment step (e.g. card form vs wallet vs SMS vs success) and renders one of the following sub-components:

- **PaymentFormCard** — Saved cards list and new card form (number, expiry, CVV when international, save-card toggle). Uses formatting and validation from `lib/viewerUtils.ts`.
- **PaymentFormWallet** — Wallet selection (e.g. Click, Payme, Uzum), then invoice screen (phone or card) and “waiting for payment” state.
- **PaymentSuccessReceipt** — Success view and “Download receipt” (html2canvas + jsPDF) and “Continue watching”.
- **PaymentSMSVerification** — SMS code entry and confirm/cancel for local cards.

Shared helpers live in **`lib/viewerUtils.ts`**: card number and expiry formatting, phone formatting (+998), and card-type detection (local vs international). Demo and default values live in **`config/viewerConstants.ts`**: priority video IDs, donation amounts, default saved cards, mock secondary account for “Switch account” in the Header. Use these instead of hard-coding in components.

---

## 6. Demo vs real data

**Demo / mock today:** Default saved cards and mock “Switch account” come from `config/viewerConstants.ts`. Monetization flows (card, wallet invoice, SMS) are currently implemented as simulated flows without a live payment gateway; invoice “polling” and success are simulated for now. The structure is ready for future integration with a real provider. Watch history for guests is localStorage; for logged-in users it is stored via the API.

**Real data:** Auth (sign in/up, session) and watch history for logged-in users use the real API (`/api/auth/*`, `/api/history`). Video catalog and playlist data are loaded via `/api/videos` and related endpoints. Search suggestions use API/local data and are wired through HeaderSearch.

The split between viewer helpers (`viewerUtils`), config (`viewerConstants`), and orchestration (e.g. MonetizationCTASection, Watch sections) is intentional: when you add real payments or change data sources, you can replace the demo layer or API calls without redesigning the UI structure.
