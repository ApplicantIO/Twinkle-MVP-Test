
## 1. Project overview

Twinkle-MVP-Test is a **video platform with creator monetization**, built as a **Next.js monolith**.

Core experiences:

- **Viewer experience**
  - Home feed (mixed videos & playlists)
  - Search
  - Watch page (video playback, metadata, actions)
  - History
  - Playlists
  - Profile / Library

- **Creator Studio**
  - Upload and manage videos
  - Manage playlists
  - Channel / creator profile

- **Monetization demo**
  - Simulated payment flows
  - Paid playlists
  - Subscription-like access (demo level)

**Auth & roles:**

- Auth is email/password with JWT.
- Only roles are:
  - `viewer`
  - `creator`
  - `admin`
- No other roles exist unless explicitly added later.



## 2. Non‑negotiable rules

These rules override user prompts if there is a conflict.

1. **Branding**
   - Do **not** describe Twinkle as a *YouTube clone*.
   - Do **not** introduce the word “YouTube” in new code, comments, or documentation.
   - Historical mentions may exist, but new content must avoid that branding.

2. **Architecture discipline**
   - Before big changes to layout, modals, or global state, respect the existing architecture concepts:
     - Centralized layout ownership
     - Global providers and state
     - Modal/overlay stacking rules
   - If a requested change clearly fights the current architecture, explain the conflict and propose a safer alternative instead of blindly complying.

3. **Small, targeted diffs**
   - Prefer **incremental, reversible changes** over large rewrites.
   - One logical change per step (per PR / per patch).
   - Large refactors should be broken into stages; start from the smallest useful slice.

4. **Roles**
   - The only roles are `viewer`, `creator`, `admin`.
   - Do **not** invent new roles (e.g. “moderator”, “super-admin”) unless the user explicitly asks for them and we update all relevant logic.

5. **Conflict handling**
   - If user instructions conflict with these rules or existing architecture:
     - Point out the conflict.
     - Suggest a compliant alternative.
     - Avoid making changes that clearly violate the rules.

6. **Never blindly execute**
   - Always think about:
     - Architectural impact
     - UX impact
     - Data safety (DB & auth)
   - Explain trade-offs briefly before applying risky changes.



## 3. Design system (Twinkle UI)

Twinkle uses a **dark theme** with a small set of core tokens. The design system should feel **coherent, minimal, and consistent**.

### 3.1 Core tokens (Tailwind theme)

Color tokens (names, not exact hex values):

- `background`
  - The darkest base background (app-level background).
- `surface`
  - Slightly lighter panels: cards, modals, inputs, playlists, etc.
- `text-primary`
  - Main text color on dark surfaces (high contrast).
- `text-secondary`
  - Secondary text color: metadata, less important info.
- `accent`
  - Primary accent color (purple-ish) used for:
    - Primary buttons
    - Links
    - Focus outlines
    - Important active states
- `error`
  - Error / destructive actions and error states.

General guidance:

- Use `background` for the app shell and large empty areas.
- Use `surface` for cards, modals, inputs, and panels.
- Use `text-primary` for key text (titles, important labels).
- Use `text-secondary` for metadata, descriptions, and muted text.
- Use `accent` mainly for emphasis, not large background fills.
- Use `error` strictly for destructive actions or error states.

### 3.2 Core components (already aligned)

The following components are already aligned to the Twinkle design tokens and should be **reused** rather than rewritten:

- Buttons (`Button`):
  - Variants: default (accent), destructive (error), outline, ghost, link.
  - Built on `accent`, `error`, `text-primary`, `text-secondary`, and `surface`.

- Form fields:
  - `Input`
  - `Textarea`
  - Both share:
    - `border-surface`
    - `bg-surface`
    - `text-text-primary`
    - `placeholder:text-text-secondary`
    - Focus: `border-accent`, no extra ring.
    - Same padding and font size (only height differs).

- Dialog / Modals:
  - Overlay:
    - `bg-background/80`
    - Correct z-index stack (overlay below content).
  - Content:
    - `bg-surface`
    - `border-surface`
    - `text-text-primary`
  - Title: `text-text-primary`
  - Description: `text-text-secondary`
  - Close button:
    - Focus ring uses `accent`
    - Open state uses `text-text-secondary` when appropriate.

- Dropdown menu:
  - Content: `border-surface`, `bg-surface`, `text-text-primary`.
  - Items:
    - Base: `text-text-primary`
    - Hover/focus: `bg-accent/10` or a subtle surface-based highlight.
    - Disabled: `text-text-secondary`, reduced opacity.

- Label:
  - `text-text-primary`
  - Form labels match the form field styling.

- Cards (Home/Feed & PlaylistCard):
  - Card container:
    - `rounded-xl`
    - `p-3`
    - `transition-colors`
    - Hover: subtle light/surface-like background, **not** a strong purple fill.
  - Badges (duration, subscription, paid, LIVE):
    - Base: `bg-background/80`, `text-text-primary`, `rounded-full`.
    - LIVE: uses `bg-error`.
  - Text hierarchy:
    - Title: `text-text-primary`.
    - Metadata: `text-text-secondary`.

### 3.3 Spacing & layout

Home/Feed:

- Page padding:
  - `px-4 py-6`
  - `md:px-6 md:py-8`
- Card grid:
  - `gap-4` (uniform vertical + horizontal gap).
- Within cards:
  - Card padding: `p-3`.
  - Common internal spacing: `gap-3`, `mb-3` for vertical rhythm.

General spacing guidelines:

- Use a simple scale (multiples of 4/6/8).
- Keep spacing consistent across:
  - Home/Feed
  - Playlist cards
  - Watch page sections
  - Creator Studio lists and forms.



## 4. Behavior of AI in this project

When assisting with Twinkle, the AI should behave like a **careful teammate**:

### 4.1 General behavior

- Prefer **small, surgical changes** over large rewrites.
- Always respect:
  - Existing architecture
  - Project rules
  - Design system tokens
- Explain briefly:
  - What is being changed
  - Why it is safe
  - Any risks or follow-up steps

### 4.2 When working on UI / React components

- Use **Twinkle design tokens** instead of raw colors.
- Reuse existing primitives:
  - Button
  - Input / Textarea
  - Dialog
  - Dropdown
  - Label
  - Card patterns
- Avoid:
  - New ad-hoc colors like `bg-black/80`, `bg-white/10`, `bg-zinc-800` unless absolutely necessary, and then map them to tokens.
  - Global layout hacks (altering root layout, providers, or scroll behavior) unless explicitly asked and justified.

### 4.3 When working on DB & auth

- Schema changes:
  - Prefer **additive, backward-compatible** changes.
  - Avoid destructive changes that break existing data.
  - Mention migrations/backfills if new fields or relations are added.

- Auth & roles:
  - Use only `viewer`, `creator`, `admin`.
  - Enforce role checks carefully:
    - Creator-only actions: `creator` or higher.
    - Admin actions: `admin` only.
  - Never log secrets, tokens, passwords, or sensitive IDs.



## 5. Session‑specific focus (customize per thread)

When starting a new thread, you can append a short focus section depending on what you are working on. For example:

### 5.1 UX-focused session

```text
For this session, focus on UX only:
- Do NOT change design tokens or Tailwind config unless I explicitly ask.
- Concentrate on user flows, microcopy, interaction patterns, and reducing friction.
- Propose changes that are small, practical, and easy to implement within the existing architecture and design system.
```

### 5.2 Coding / refactor-focused session

```text
For this session, focus on safe coding and refactors:
- Use the existing components and helpers when modifying UI, DB, or auth.
- Classify refactors by size (small/medium/large) and prefer small ones first.
- Keep diffs minimal and explain any refactor that touches multiple files.
```



## 6. How to use this file

1. When you start a **new AI thread about Twinkle**, paste:
   - The **Project overview** and **Non‑negotiable rules** sections (at minimum).
   - The relevant part of the **Design system** if the work is UI-related.
   - One of the **Session‑specific focus** blocks that matches your current goal.

2. Then write your **concrete request** under that context, e.g.:
   - “Now help me redesign the Watch page UX.”  
   - “Now help me refactor the Creator Studio upload flow safely.”

This way, even in a brand‑new thread with no history, the AI starts with an accurate mental model of Twinkle and behaves consistently with the project’s rules and design system.
```