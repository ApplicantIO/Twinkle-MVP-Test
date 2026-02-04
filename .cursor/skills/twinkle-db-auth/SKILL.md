---
name: twinkle-db-auth
description: Database and auth guidelines for Twinkle. Use when editing schema.prisma, DB access code, or auth/session/role logic — additive schema changes, viewer/creator/admin roles, reuse helpers, never log secrets.
---

# Twinkle DB & Auth

Use this skill when editing `schema.prisma`, DB access code, or auth/session/role logic in Twinkle-MVP-Test.

## When to use

- Editing `prisma/schema.prisma`.
- Editing database access code or API routes that touch the DB.
- Editing auth, session, or role checks.

## Database

- Follow **docs/DATABASE_SETUP.md** and **docs/REFRACTORING_LEVELS.md**.
- Prefer additive schema changes (new optional fields, new tables).
- Avoid destructive changes that break existing data.
- Mention migrations/backfills when a change requires them.

## Auth

- **Roles:** Only `viewer`, `creator`, `admin`. No new roles unless explicitly requested.
- Reuse existing auth helpers and JWT/password logic in `lib/`.
- Enforce proper role checks: creator-only actions require `creator` or higher; admin-only actions must be clearly guarded.
- Never log secrets, tokens, or passwords; do not expose them in error messages or client responses.

## Checklist

- **Schema changes:** Read docs; prefer additive; note migration/backfill if needed.
- **API routes that touch DB:** Correct role check; reuse existing auth; no secrets in logs or responses.
- **Sensitive routes:** Verify auth and role before returning data.
