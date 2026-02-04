# Twinkle Documentation

## Setup & Getting Started

- **[QUICKSTART.md](./QUICKSTART.md)** – Quick start guide
- **[SETUP.md](./SETUP.md)** – Setup instructions
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** – Database connection and user setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** – Sign-in troubleshooting

## Code Analysis

- **[CODE_ANALYSIS.md](./CODE_ANALYSIS.md)** – Unused code audit, dead code removal, and quality notes

## Architecture

- **[ARCHITECTURE_RULES.md](./ARCHITECTURE_RULES.md)** – Frontend architecture constitution (required reading before making changes)
  - Z-index scale (L0–L5)
  - Modal system (single ModalProvider)
  - Layout rules (pages adapt to layout)
  - Route-agnostic sidebar

## Key Concepts

### Watch History
- **Logged-in users:** Stored in database (`watch_history` table)
- **Guests:** Stored in localStorage (last 50 videos)
- **API:** `GET /api/history`, `POST /api/history`, `DELETE /api/history`
- **Tracking:** `useWatchHistoryTracker` hook (5s threshold)

### Z-Index Compliance
Run `npm run check:z-index` to detect arbitrary `z-[...]` usage. Use only allowed scale values.
