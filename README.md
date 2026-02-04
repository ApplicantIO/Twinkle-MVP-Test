# Twinkle

A video platform with creator monetization, built as a Next.js monolith, focused on a modern viewer experience and a simple Creator Studio.

## Overview

**What it does:** Viewers can browse a home feed, search, watch videos, and use watch history, playlists, and basic profile/library flows. Creators get a Creator Studio to upload and manage videos and channel profiles. The app includes a basic monetization demo (simulated payment flows). Authentication is email/password with JWT; roles are viewer, creator, and admin.

**Tech stack:** Next.js (App Router), React, TypeScript, PostgreSQL with Prisma, Tailwind CSS for styling. Single app—no separate backend server; API routes live in `app/api/`.

**State of the project:** Viewer experience (home, watch, search, history, monetization demo) is functional. Creator Studio and admin features are basic or work-in-progress.

## Getting Started

- **Clone** the repo and open the project directory.
- **Install dependencies:** `npm install`
- **Set up PostgreSQL** and create the `twinkle` database; create a `.env` from `.env.example` with `DATABASE_URL` and `JWT_SECRET`.
- **Initialize DB and run:** `npm run prisma:generate`, `npm run prisma:push`, then `npm run dev` (optionally `npm run setup` for a one-shot install+Prisma+upload dirs; `npm run reset:user` for a default test user).

For a minimal path from clone to running app, see [docs/QUICKSTART.md](./docs/QUICKSTART.md).  
For full setup (env, DB, scripts, file structure), see [docs/SETUP.md](./docs/SETUP.md).  
For database and sign-in details, see [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md).  
Sign-in issues: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

## Architecture & Docs

Before making structural changes to layout, modals, or global state, read the architecture docs.

- **[docs/ARCHITECTURE_RULES.md](./docs/ARCHITECTURE_RULES.md)** — Frontend “constitution”: z-index scale, layout, modals, providers, scroll.
- **[docs/ARCHITECTURE_VIEWER.md](./docs/ARCHITECTURE_VIEWER.md)** — Viewer routes, layout, contexts, Watch page and monetization.
- **[docs/REFRACTORING_LEVELS.md](./docs/REFRACTORING_LEVELS.md)** — Level 1/2/3 refactor history and how to scope future refactors.
- **[docs/AI_CODING_GUIDE.md](./docs/AI_CODING_GUIDE.md)** — Guide for AI agents and contributors (safe refactors, when to refuse a request).
- **[docs/README.md](./docs/README.md)** — Full docs index.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run setup` | Install deps, Prisma generate/push, create upload dirs |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run reset:user` | Reset users and create default test user |
| `npm run check:z-index` | Enforce z-index architecture (no arbitrary `z-[...]`) |

More scripts and details: [docs/SETUP.md](./docs/SETUP.md), [scripts/README.md](./scripts/README.md).

## Contribution & AI Usage

Contributors and AI tools should read [docs/AI_CODING_GUIDE.md](./docs/AI_CODING_GUIDE.md) and [docs/ARCHITECTURE_RULES.md](./docs/ARCHITECTURE_RULES.md) before editing layout, modals, or global state. The Cursor rule [.cursor/rules/twinkle-project-rule.mdc](./.cursor/rules/twinkle-project-rule.mdc) points AI agents to these docs and requires checking architecture rules before making changes.

## Status & Roadmap

This section is intentionally high-level; always check the code for the exact current state.

- **Viewer experience:** Working—home feed, watch page, search, history, basic monetization demo.
- **Creator Studio:** Basic upload and manage flow; some areas WIP.
- **Payments:** Simulated flows only; real payment gateway not integrated.
- **Production hardening** (cloud storage, transcoding, monitoring) is planned for later.