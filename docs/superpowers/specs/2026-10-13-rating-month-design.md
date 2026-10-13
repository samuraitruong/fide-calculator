# Rating month

Each game has independent game date and rating month (`YYYY-MM`, valid calendar month).
Monthly partitions and live rating use rating month. New games default rating month
from game date; later date edits preserve their assigned rating month. Users can edit
rating month. Move to Current Month updates only rating month. Current rating-month
games can be deleted after confirmation; prior months do not offer deletion.

Migration preserves existing assigned monthKey/month_key when valid (legacy YYYY-Mon
or numeric YYYY-MM), then falls back to the game date. Local storage and imported
records normalize on load/write and persist migrated data. Add Supabase rating_month,
backfill, validate and index it without deleting games or changing game_date.
Keep legacy month_key for backwards compatibility, synchronized by a database trigger.

Shared helpers own validation, migration, display labels, current-month membership
and grouping so web/mobile agree. Keep Result.ratingMonth optional at the legacy input
boundary; every persisted new/migrated record has a validated value. Existing monthKey
in client records/MonthlyData becomes canonical YYYY-MM for compatibility with UI APIs.

No external production data changes until the exact migration has been validated and
the intended database identified. Preserve all existing uncommitted session changes.
