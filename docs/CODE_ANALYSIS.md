# Code Analysis Report

*Generated: 2026-01-31*

## Build Status

✅ **Project builds successfully** (`npm run build`)

## Removed (Dead Code)

| Item | Reason |
|------|--------|
| `components/history/HistoryCalendarModal.tsx` | Never imported. "Find history date" feature was removed from sidebar. |
| `hooks/useLayoutPreference.ts` | Never imported. Intended for playlist list/grid toggle, not implemented. |
| Unused imports in `HistoryPageClient.tsx` | `getWatchHistoryFromDatabase`, `WatchHistoryDatabaseEntry` – page uses `fetch('/api/history')` instead. |

## Unused but Kept (Low Risk)

| Item | Location | Notes |
|------|----------|-------|
| `getVideoWatchHistory()` | `lib/watchHistory.ts` | Could support "resume from last position" in future. |
| `getLastWatchedVideoInPlaylist()` | `lib/watchHistory.ts` | Related utility; `getPlaylistProgress()` is used instead. |
| `getWatchHistoryFromDatabase()` | `lib/watchHistory.ts` | Client fetches via API directly. Kept for potential reuse. |
| `builder.config.json` | root | Cursor/IDE config. Not referenced by app code. |

## Code Quality Notes

### Clarity & Readability
- Architecture rules (`docs/ARCHITECTURE_RULES.md`) are well-defined
- Z-index scale is enforced via `npm run check:z-index`
- Modal system is centralized (ModalProvider)
- Watch history uses clear DB vs localStorage split

### Build Warning
- `ReferenceError: location is not defined` during static page generation – may come from a dependency (e.g. `baseline-browser-mapping`). Build still completes. Consider updating `baseline-browser-mapping@latest` if it persists.

### Potential Improvements
1. **HistoryCalendarModal** – Removed. If "Find history date" is needed again, restore from git history.
2. **useLayoutPreference** – Removed. If playlist list/grid toggle is added, implement a new hook.
3. **lib/watchHistory** – `getVideoWatchHistory` and `getLastWatchedVideoInPlaylist` could be used for resume behavior; consider wiring or removing.
