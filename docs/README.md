# Twinkle Documentation

This folder is the main entry point for Twinkle docs: setup, architecture, and contribution guidelines for founders, developers, and AI agents.

---

## Setup & Getting Started

- **[QUICKSTART.md](./QUICKSTART.md)** — Minimal steps to get the app running (install, DB, env, run dev).
- **[SETUP.md](./SETUP.md)** — Full setup: environment, database, scripts, file structure, and first creator account.
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** — Database connection, sign-in fix, and default user creation.
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** — Common runtime and auth issues and how to fix them.

---

## Architecture

- **[ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)** — Frontend “constitution”: z-index scale, layout, modals, providers, scroll, and page rules. Required reading before making structural changes.
- **[ARCHITECTURE_VIEWER.md](./ARCHITECTURE_VIEWER.md)** — Viewer-side map: routes, root layout, contexts, Watch page sections, and monetization components.
- **[REFRACTORING_LEVELS.md](./REFRACTORING_LEVELS.md)** — Level 1/2/3 refactor history and how to scope future refactors.

---

## AI & Contribution

- **[AI_CODING_GUIDE.md](./AI_CODING_GUIDE.md)** — Rules and patterns for AI agents and developers when editing the codebase (layout, modals, helpers, splitting components, when to refuse or adapt).
- The Cursor rule file `.cursor/rules/twinkle-project-rule.mdc` enforces that ARCHITECTURE_RULES is checked before changes; it points agents to this docs folder.

---

## Code Analysis & Tech Debt

- **[CODE_ANALYSIS.md](./CODE_ANALYSIS.md)** — Historical snapshot of dead code, unused items, and build/quality notes. Optional reference; may be outdated as the codebase evolves and should not be treated as source of truth.

---

## Scripts

- **[../scripts/README.md](../scripts/README.md)** — Documentation for the YouTube creator import script and other scripts in `scripts/`.
