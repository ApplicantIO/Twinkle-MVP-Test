# Twinkle Memory Bank (Adapted)

This Memory Bank is adapted from the `cursor-memory-bank-main` template for the `Twinkle-MVP-Test` repository.

## Purpose

Use this folder as persistent working context across implementation phases:

- `/van` (initialize and classify complexity)
- `/plan` (implementation plan)
- `/creative` (design decisions when needed)
- `/build` (implementation)
- `/reflect` (retrospective)
- `/archive` (final task archive)

## Core Files

- `tasks.md` - current task source of truth
- `activeContext.md` - immediate focus and next actions
- `progress.md` - execution notes and verification status
- `projectbrief.md` - project foundation
- `productContext.md` - product-level requirements and behavior
- `systemPatterns.md` - architecture and recurring patterns
- `techContext.md` - stack and environment context
- `style-guide.md` - coding and UX conventions

## Twinkle-Specific Constraints

- Keep architecture aligned with `docs/ARCHITECTURE_RULES.md` and related viewer architecture docs.
- Use only the existing roles: `viewer`, `creator`, and `admin`.
- Prefer small, targeted diffs over broad rewrites.
- Avoid introducing branding that reframes the product identity.

## Usage

1. Start each new task by updating `tasks.md` and `activeContext.md`.
2. Record decisions and validation results in `progress.md`.
3. Archive completed tasks in `archive/` and reset active files for the next task.
