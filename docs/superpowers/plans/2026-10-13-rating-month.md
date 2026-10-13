# Rating Month Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for independent implementation tasks and a final code review. Steps use checkbox syntax.

**Goal:** Independent rating month determines monthly live rating, with migration and current-month deletion.
**Architecture:** Shared helpers normalize legacy data and group by canonical YYYY-MM; all six storage hooks use them. UI defaults on create and retains assigned month on date edit. SQL adds validated rating_month while preserving legacy month_key.
**Tech Stack:** TypeScript, React/React Native, Supabase/Postgres, Jest.
**Spec:** docs/superpowers/specs/2026-10-13-rating-month-design.md

## Global Constraints
- No game-date edits during moves or migration; preserve existing game/profile data.
- Strict YYYY-MM on explicit new input; tolerate legacy monthKey only in migration.
- Delete only current rating-month records after confirmation; do not delete cloud/local records as part of migration.
- Preserve existing session edits; no commits, resets or new dependencies.

## Review Focus
- Different game month/rating month, including year boundaries and western timezones.
- Legacy YYYY-Mon and numeric keys, date-only/local date strings, idempotent migrations.
- Cloud failures retain editor and surface errors; target row by ID, not month-local index.
- Delete last record persists empty local list; mounted home/history stay consistent.
- Import/export preserves rating month independently of game date.

### Task 1: Shared model and SQL migration
Ownership: packages/shared/src/types.ts, packages/shared/src/index.ts, new packages/shared/src/ratingMonth.ts, shared model copies supabase/types.ts and apps/web/supabase/types.ts; new SQL migration in both supabase/migrations copies. New shared tests in apps/web/src/util/__tests__/ratingMonth.test.ts.
Interfaces: isValidRatingMonth(value: unknown): value is string; getRatingMonthFromDate(date: string | Date): string; normalizeRatingMonth(value?: string): string | undefined; getResultRatingMonth(result: Pick<Result,'date'|'monthKey'|'ratingMonth'>): string; migrateResultRatingMonth(result: Result): Result; groupResultsByRatingMonth(results: Result[], type: RatingType, now?: Date): MonthlyData[]; getRatingMonthDisplayName(month: string): string.
- [x] Write/run failing tests for validation, legacy precedence, idempotence, preserved dates and grouping/live membership.
- [x] Implement helpers/types and additive SQL backfill/check/index/legacy synchronization.
- [x] Run tests, build shared and review SQL with rollback/operational notes.

### Task 2: Mobile UI
Ownership: apps/mobile/src/components/FideCalculator.tsx, EditGameModal.tsx, screens/HistoryScreen.tsx, mobile contexts if shared local state needs context; existing apps/web/src/components/__tests__/EditGameModal.test.tsx and new mobile UI tests there.
- [x] Update regression to require move callback only {ratingMonth: current YYYY-MM} and date unchanged; run failing tests.
- [x] Create/edit rating month field with format validation; new game default from date; use getResultRatingMonth for live filter.
- [x] Add confirmed current-rating-month deletion in editor/history, surface persistence errors, stable ID targeting.
- [x] Verify valid/invalid month, failed save/delete and current-month-only deletion.

### Task 3: Web UI and import/export
Ownership: apps/web/src/components and src/components FideCalculator, ListRatingChange, MonthlyRatingList, ImportExport, MonthlyView; backup hooks if needed and corresponding tests. Do not edit existing EditGameModal test owned by Task 2.
- [x] Write/run failing tests for independent rating month and current-month deletion targets.
- [x] Add rating month input/display, preserve date on move, use correct global result ID/index for delete, default new month from date.
- [x] Ensure imports/exports/backups preserve explicit ratingMonth, migrate legacy records and valid monthly displays.
- [x] Verify both root legacy web copy and apps/web remain aligned.

### Task 4: Storage/integration (root implementer)
Ownership: all six useLocalStorage/useSupabaseRatingList hooks, app providers only if necessary, storage integration tests, migration operational docs.
- [x] Write/run failing tests for partitioning by ratingMonth, preserved date on update, empty-list deletion persistence and cloud payloads.
- [x] Normalize reads/add/update/import; group via shared helper; map rating_month DB; await and surface save/delete failures.
- [x] Persist migrated local records, ensure mounted screens observe changes without overwriting stored data.
- [x] Identify migration target, validate/apply where authorized and available; run suite/types/build checks and final review.
