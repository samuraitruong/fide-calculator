-- Add independent rating-month assignment without changing game_date or deleting rows.
BEGIN;

ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rating_month TEXT;

CREATE OR REPLACE FUNCTION public.normalize_rating_month(value TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE
  month_number INTEGER;
BEGIN
  IF length(value) = 7 AND value ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RETURN value;
  END IF;
  IF length(value) = 8 AND value ~ '^[0-9]{4}-[A-Za-z]{3}$' THEN
    month_number := array_position(ARRAY['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], substring(value FROM 6));
    IF month_number IS NOT NULL THEN
      RETURN substring(value FROM 1 FOR 4) || '-' || lpad(month_number::TEXT, 2, '0');
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- Prefer existing assignment over game date. Existing valid canonical values survive reruns.
UPDATE public.games
SET rating_month = COALESCE(public.normalize_rating_month(month_key), to_char(game_date, 'YYYY-MM'))
WHERE rating_month IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.games'::regclass AND conname = 'games_rating_month_valid'
  ) THEN
    ALTER TABLE public.games ADD CONSTRAINT games_rating_month_valid
      CHECK (length(rating_month) = 7 AND rating_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$') NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.games VALIDATE CONSTRAINT games_rating_month_valid;
ALTER TABLE public.games ALTER COLUMN rating_month SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_profile_type_rating_month
  ON public.games (user_profile_id, rating_type, rating_month);

CREATE OR REPLACE FUNCTION public.sync_game_rating_month()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE
  normalized TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.rating_month IS NULL THEN
      NEW.rating_month := COALESCE(public.normalize_rating_month(NEW.month_key), to_char(NEW.game_date, 'YYYY-MM'));
    END IF;
  ELSIF NEW.rating_month IS DISTINCT FROM OLD.rating_month THEN
    -- Explicit canonical assignment wins when both columns change.
    NULL;
  ELSIF NEW.month_key IS DISTINCT FROM OLD.month_key THEN
    -- Old clients move games using month_key; date-only edits keep assignment.
    normalized := public.normalize_rating_month(NEW.month_key);
    IF normalized IS NULL THEN
      RAISE EXCEPTION 'Invalid legacy rating month: %', NEW.month_key USING ERRCODE = '22023';
    END IF;
    NEW.rating_month := normalized;
  END IF;

  IF NEW.rating_month IS NULL OR length(NEW.rating_month) <> 7
     OR NEW.rating_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' THEN
    RAISE EXCEPTION 'Rating month must be YYYY-MM with a valid calendar month' USING ERRCODE = '22023';
  END IF;
  -- Preserve the legacy English YYYY-Mon format for old-client reads and filters.
  NEW.month_key := substring(NEW.rating_month FROM 1 FOR 4) || '-' ||
    (ARRAY['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[substring(NEW.rating_month FROM 6)::INTEGER];
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS sync_game_rating_month ON public.games;
CREATE TRIGGER sync_game_rating_month BEFORE INSERT OR UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.sync_game_rating_month();

-- Normalize any previously numeric month_key, preserving assigned rating_month.
UPDATE public.games SET month_key = substring(rating_month FROM 1 FOR 4) || '-' ||
  (ARRAY['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[substring(rating_month FROM 6)::INTEGER]
WHERE month_key IS DISTINCT FROM substring(rating_month FROM 1 FOR 4) || '-' ||
  (ARRAY['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])[substring(rating_month FROM 6)::INTEGER];

COMMIT;
