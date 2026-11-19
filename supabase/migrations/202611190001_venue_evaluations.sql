-- Venue (Halı Saha Tesisi) Registry & Post-Match Facility Evaluations

CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL DEFAULT 'Kadıköy',
  address TEXT,
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('Açık Saha', 'Kapalı Saha')) DEFAULT 'Açık Saha',
  overall_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (overall_rating BETWEEN 0 AND 5),
  turf_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (turf_rating BETWEEN 0 AND 5),
  lighting_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (lighting_rating BETWEEN 0 AND 5),
  locker_room_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (locker_room_rating BETWEEN 0 AND 5),
  organization_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (organization_rating BETWEEN 0 AND 5),
  evaluations_count INT NOT NULL DEFAULT 0 CHECK (evaluations_count >= 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_venues_identity
  ON public.venues (lower(trim(name)), lower(trim(district)), lower(trim(city)));
CREATE INDEX IF NOT EXISTS idx_venues_city_district ON public.venues(city, district);
CREATE INDEX IF NOT EXISTS idx_venues_overall_rating ON public.venues(overall_rating DESC);

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_venue_id ON public.matches(venue_id);

CREATE TABLE IF NOT EXISTS public.venue_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_name TEXT NOT NULL,
  overall_rating NUMERIC(3,2) NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  turf_rating INT NOT NULL CHECK (turf_rating BETWEEN 1 AND 5),
  lighting_rating INT NOT NULL CHECK (lighting_rating BETWEEN 1 AND 5),
  locker_room_rating INT NOT NULL CHECK (locker_room_rating BETWEEN 1 AND 5),
  organization_rating INT NOT NULL CHECK (organization_rating BETWEEN 1 AND 5),
  highlights TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, evaluator_id)
);

CREATE INDEX IF NOT EXISTS idx_venue_evaluations_venue_created
  ON public.venue_evaluations(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_evaluations_match_id
  ON public.venue_evaluations(match_id);
CREATE INDEX IF NOT EXISTS idx_venue_evaluations_evaluator_id
  ON public.venue_evaluations(evaluator_id);

CREATE OR REPLACE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.resolve_match_venue_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_venue_id UUID;
  v_name TEXT;
  v_city TEXT;
  v_district TEXT;
BEGIN
  v_name := TRIM(COALESCE(NEW.venue_name, ''));
  v_city := COALESCE(NULLIF(TRIM(NEW.city), ''), 'İstanbul');
  v_district := COALESCE(NULLIF(TRIM(NEW.district), ''), 'Kadıköy');

  IF char_length(v_name) < 2 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_venue_id
  FROM public.venues
  WHERE lower(trim(name)) = lower(v_name)
    AND lower(trim(district)) = lower(v_district)
    AND lower(trim(city)) = lower(v_city)
  LIMIT 1;

  IF v_venue_id IS NULL THEN
    INSERT INTO public.venues (name, city, district, address, pitch_type)
    VALUES (v_name, v_city, v_district, NULLIF(TRIM(NEW.address), ''), NEW.pitch_type)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_venue_id;

    IF v_venue_id IS NULL THEN
      SELECT id INTO v_venue_id
      FROM public.venues
      WHERE lower(trim(name)) = lower(v_name)
        AND lower(trim(district)) = lower(v_district)
        AND lower(trim(city)) = lower(v_city)
      LIMIT 1;
    END IF;
  END IF;

  NEW.venue_id := v_venue_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.resolve_match_venue_before_write() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_matches_resolve_venue
  BEFORE INSERT OR UPDATE OF venue_name, district, city, address, pitch_type ON public.matches
  FOR EACH ROW EXECUTE FUNCTION private.resolve_match_venue_before_write();

-- Backfill existing matches if any exist
UPDATE public.matches
SET venue_name = venue_name
WHERE venue_id IS NULL;

CREATE OR REPLACE FUNCTION private.validate_venue_evaluation_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_venue_id UUID;
  v_eval_name TEXT;
  v_is_participant BOOLEAN;
BEGIN
  SELECT * INTO v_match
  FROM public.matches
  WHERE id = NEW.match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.is_completed IS NOT TRUE THEN
    RAISE EXCEPTION 'Tesis değerlendirmesi yalnızca tamamlanan maçlardan sonra yapılabilir';
  END IF;

  v_is_participant := (
    v_match.organizer_id = NEW.evaluator_id
    OR EXISTS (
      SELECT 1
      FROM public.roster_slots rs
      WHERE rs.match_id = NEW.match_id
        AND rs.assigned_player_id = NEW.evaluator_id
        AND rs.is_filled = TRUE
    )
  );

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'Bu tesisi yalnızca bu maçta oynayan oyuncular değerlendirebilir';
  END IF;

  v_venue_id := v_match.venue_id;
  IF v_venue_id IS NULL THEN
    INSERT INTO public.venues (name, city, district, address, pitch_type)
    VALUES (
      TRIM(v_match.venue_name),
      COALESCE(NULLIF(TRIM(v_match.city), ''), 'İstanbul'),
      COALESCE(NULLIF(TRIM(v_match.district), ''), 'Kadıköy'),
      NULLIF(TRIM(v_match.address), ''),
      v_match.pitch_type
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_venue_id;

    IF v_venue_id IS NULL THEN
      SELECT id INTO v_venue_id
      FROM public.venues
      WHERE lower(trim(name)) = lower(trim(v_match.venue_name))
        AND lower(trim(district)) = lower(trim(v_match.district))
        AND lower(trim(city)) = lower(trim(v_match.city))
      LIMIT 1;
    END IF;

    UPDATE public.matches SET venue_id = v_venue_id WHERE id = v_match.id;
  END IF;

  NEW.venue_id := v_venue_id;

  SELECT name INTO v_eval_name
  FROM public.profiles
  WHERE id = NEW.evaluator_id;

  NEW.evaluator_name := COALESCE(NULLIF(TRIM(v_eval_name), ''), NEW.evaluator_name, 'Oyuncu');
  NEW.overall_rating := ROUND(
    ((NEW.turf_rating + NEW.lighting_rating + NEW.locker_room_rating + NEW.organization_rating)::numeric / 4.0),
    2
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.validate_venue_evaluation_before_insert() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_venue_evaluations_validate
  BEFORE INSERT ON public.venue_evaluations
  FOR EACH ROW EXECUTE FUNCTION private.validate_venue_evaluation_before_insert();

CREATE OR REPLACE FUNCTION private.recalculate_venue_ratings_after_eval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_venue_id UUID;
  v_overall NUMERIC(3,2);
  v_turf NUMERIC(3,2);
  v_lighting NUMERIC(3,2);
  v_locker NUMERIC(3,2);
  v_org NUMERIC(3,2);
  v_count INT;
  v_amenities TEXT[];
BEGIN
  v_venue_id := COALESCE(NEW.venue_id, OLD.venue_id);

  SELECT
    COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0.00),
    COALESCE(ROUND(AVG(turf_rating)::numeric, 2), 0.00),
    COALESCE(ROUND(AVG(lighting_rating)::numeric, 2), 0.00),
    COALESCE(ROUND(AVG(locker_room_rating)::numeric, 2), 0.00),
    COALESCE(ROUND(AVG(organization_rating)::numeric, 2), 0.00),
    COUNT(*)::int
  INTO v_overall, v_turf, v_lighting, v_locker, v_org, v_count
  FROM public.venue_evaluations
  WHERE venue_id = v_venue_id;

  SELECT COALESCE(ARRAY(
    SELECT tag
    FROM (
      SELECT unnest(highlights) AS tag, COUNT(*) AS cnt
      FROM public.venue_evaluations
      WHERE venue_id = v_venue_id
      GROUP BY tag
      ORDER BY cnt DESC, tag ASC
      LIMIT 6
    ) ranked
  ), '{}'::text[])
  INTO v_amenities;

  UPDATE public.venues
  SET
    overall_rating = v_overall,
    turf_rating = v_turf,
    lighting_rating = v_lighting,
    locker_room_rating = v_locker,
    organization_rating = v_org,
    evaluations_count = v_count,
    amenities = v_amenities
  WHERE id = v_venue_id;

  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET prediction_score = prediction_score + 10
    WHERE id = NEW.evaluator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET prediction_score = GREATEST(0, prediction_score - 10)
    WHERE id = OLD.evaluator_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION private.recalculate_venue_ratings_after_eval() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_venue_evaluations_recalc
  AFTER INSERT OR DELETE ON public.venue_evaluations
  FOR EACH ROW EXECUTE FUNCTION private.recalculate_venue_ratings_after_eval();

-- Grants & Row Level Security
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_evaluations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.venues FROM PUBLIC, anon;
REVOKE ALL ON public.venue_evaluations FROM PUBLIC, anon;

GRANT SELECT ON public.venues TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.venue_evaluations TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'venues' AND policyname = 'venues_select_authenticated'
  ) THEN
    CREATE POLICY "venues_select_authenticated" ON public.venues
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'venue_evaluations' AND policyname = 'venue_evaluations_select_authenticated'
  ) THEN
    CREATE POLICY "venue_evaluations_select_authenticated" ON public.venue_evaluations
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'venue_evaluations' AND policyname = 'venue_evaluations_insert_evaluator'
  ) THEN
    CREATE POLICY "venue_evaluations_insert_evaluator" ON public.venue_evaluations
      FOR INSERT TO authenticated
      WITH CHECK ((SELECT auth.uid()) = evaluator_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'venue_evaluations' AND policyname = 'venue_evaluations_delete_own'
  ) THEN
    CREATE POLICY "venue_evaluations_delete_own" ON public.venue_evaluations
      FOR DELETE TO authenticated
      USING ((SELECT auth.uid()) = evaluator_id);
  END IF;
END $$;

-- Realtime publication
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['venues', 'venue_evaluations'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
