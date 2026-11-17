-- Kadro - Supabase PostgreSQL Schema, Indexes, RLS Policies & Atomic RPCs
-- Run this script in Supabase SQL Editor (or via Supabase MCP / CLI)

-- 1. Profiles (Players & Captains)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')) DEFAULT 'MID',
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
  fair_play_rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
  matches_played INT NOT NULL DEFAULT 0,
  preferred_foot TEXT NOT NULL CHECK (preferred_foot IN ('Right', 'Left', 'Both')) DEFAULT 'Right',
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL DEFAULT 'Kadıköy',
  avatar_url TEXT,
  bio TEXT,
  prediction_score INT NOT NULL DEFAULT 0,
  total_predictions INT NOT NULL DEFAULT 0,
  correct_predictions INT NOT NULL DEFAULT 0,
  evaluations_count INT NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create a player profile when a new Supabase Auth user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_name TEXT;
  v_position TEXT;
  v_city TEXT;
  v_district TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'Yeni Oyuncu'
  );

  v_position := COALESCE(NEW.raw_user_meta_data ->> 'position', 'MID');
  IF v_position NOT IN ('GK', 'DEF', 'MID', 'FWD') THEN
    v_position := 'MID';
  END IF;

  v_city := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'city'), ''), 'İstanbul');
  v_district := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'district'), ''), 'Kadıköy');

  INSERT INTO public.profiles (id, name, email, position, city, district)
  VALUES (NEW.id::text, v_name, NEW.email, v_position, v_city, v_district)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Matches
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL,
  date_label TEXT NOT NULL,
  time_range TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')),
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('Açık Saha', 'Kapalı Saha')),
  fee_per_player INT NOT NULL CHECK (fee_per_player >= 0),
  total_slots INT NOT NULL CHECK (total_slots > 0),
  missing_positions TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  final_score_team1 INT,
  final_score_team2 INT,
  prediction JSONB,
  matchup_stats JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_district ON public.matches(district);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON public.matches(created_at DESC);

-- 3. Roster Slots (Lineup slots per match)
CREATE TABLE IF NOT EXISTS public.roster_slots (
  id TEXT NOT NULL,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot_order INT NOT NULL DEFAULT 0,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  is_filled BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_player_id TEXT,
  assigned_player_name TEXT,
  assigned_player_phone TEXT,
  assigned_player_rating NUMERIC(3,2),
  assigned_player_fair_play NUMERIC(3,2),
  is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (match_id, id)
);

CREATE INDEX IF NOT EXISTS idx_roster_slots_match ON public.roster_slots(match_id, slot_order);

-- 4. Squad Join Requests (Player request -> Captain approval)
CREATE TABLE IF NOT EXISTS public.join_requests (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  requester_id TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT,
  requester_rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
  requester_fair_play NUMERIC(3,2) NOT NULL DEFAULT 4.90,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_join_requests_match_status ON public.join_requests(match_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester ON public.join_requests(requester_id);

-- 5. Regional Leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  season TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')),
  status TEXT NOT NULL CHECK (status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'REGISTRATION_OPEN',
  max_teams INT NOT NULL,
  registered_teams_count INT NOT NULL DEFAULT 1,
  entry_fee INT NOT NULL DEFAULT 0,
  prize TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT NOT NULL,
  description TEXT NOT NULL,
  rules TEXT[] NOT NULL DEFAULT '{}',
  theme_color TEXT NOT NULL DEFAULT '#16A34A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. League Teams
CREATE TABLE IF NOT EXISTS public.league_teams (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_emoji TEXT NOT NULL DEFAULT '⚽',
  captain_name TEXT NOT NULL,
  captain_phone TEXT,
  played INT NOT NULL DEFAULT 0,
  won INT NOT NULL DEFAULT 0,
  drawn INT NOT NULL DEFAULT 0,
  lost INT NOT NULL DEFAULT 0,
  goals_for INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  form TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_league_teams_league ON public.league_teams(league_id, points DESC);

-- 7. League Fixtures
CREATE TABLE IF NOT EXISTS public.league_fixtures (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  week INT NOT NULL,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INT,
  away_score INT,
  date_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  venue TEXT NOT NULL,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_league_fixtures_league_week ON public.league_fixtures(league_id, week);

-- 8. Post-Match Player & Fair-Play Evaluations
CREATE TABLE IF NOT EXISTS public.player_evaluations (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  match_title TEXT NOT NULL,
  evaluator_id TEXT NOT NULL,
  evaluator_name TEXT NOT NULL,
  target_player_id TEXT NOT NULL,
  target_player_name TEXT NOT NULL,
  target_player_position TEXT,
  is_opponent BOOLEAN NOT NULL DEFAULT TRUE,
  skill_rating INT NOT NULL CHECK (skill_rating BETWEEN 1 AND 5),
  fair_play_rating INT NOT NULL CHECK (fair_play_rating BETWEEN 1 AND 5),
  badges TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, evaluator_id, target_player_id)
);

-- 9. Second-Hand Gear Marketplace
CREATE TABLE IF NOT EXISTS public.gear_items (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_phone TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Boots', 'Jerseys', 'Gloves', 'Equipment')),
  brand TEXT NOT NULL,
  size TEXT NOT NULL,
  price INT NOT NULL CHECK (price >= 0),
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Sold')) DEFAULT 'Available',
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_items_created_at ON public.gear_items(created_at DESC);

-- Atomic Captain Approval RPC: prevents double-booking a roster slot
CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id TEXT;
  v_req public.join_requests%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_chosen_slot_id TEXT;
  v_half_slots INT;
  v_missing TEXT[];
BEGIN
  v_caller_id := (SELECT auth.uid())::text;
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_req
  FROM public.join_requests
  WHERE id = p_request_id AND status = 'PENDING'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = v_req.match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only the match captain / organizer can approve join requests
  IF v_match.organizer_id <> v_caller_id THEN
    RETURN FALSE;
  END IF;

  -- Prevent duplicate placement if player already joined
  IF EXISTS (
    SELECT 1 FROM public.roster_slots
    WHERE match_id = v_req.match_id AND assigned_player_id = v_req.requester_id
  ) THEN
    RETURN FALSE;
  END IF;

  v_half_slots := CEIL(v_match.total_slots / 2.0)::INT;

  -- Try requested slot first, otherwise pick another open slot of same position in Team 1
  SELECT id INTO v_chosen_slot_id
  FROM public.roster_slots
  WHERE match_id = v_req.match_id
    AND id = v_req.slot_id
    AND is_filled = FALSE
    AND slot_order < v_half_slots
  FOR UPDATE;

  IF v_chosen_slot_id IS NULL THEN
    SELECT id INTO v_chosen_slot_id
    FROM public.roster_slots
    WHERE match_id = v_req.match_id
      AND position = v_req.position
      AND is_filled = FALSE
      AND slot_order < v_half_slots
    ORDER BY slot_order ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF v_chosen_slot_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.roster_slots
  SET
    is_filled = TRUE,
    assigned_player_id = v_req.requester_id,
    assigned_player_name = v_req.requester_name,
    assigned_player_phone = v_req.requester_phone,
    assigned_player_rating = v_req.requester_rating,
    assigned_player_fair_play = v_req.requester_fair_play
  WHERE match_id = v_req.match_id AND id = v_chosen_slot_id;

  SELECT COALESCE(ARRAY_AGG(position ORDER BY slot_order), '{}')
  INTO v_missing
  FROM public.roster_slots
  WHERE match_id = v_req.match_id
    AND slot_order < v_half_slots
    AND is_filled = FALSE;

  UPDATE public.matches
  SET missing_positions = v_missing
  WHERE id = v_req.match_id;

  UPDATE public.join_requests
  SET
    slot_id = v_chosen_slot_id,
    status = 'APPROVED',
    responded_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$;

-- Row Level Security (Authenticated-only access with ownership checks)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Clean up any earlier permissive demo policies
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles',
    'matches',
    'roster_slots',
    'join_requests',
    'leagues',
    'league_teams',
    'league_fixtures',
    'player_evaluations',
    'gear_items'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow public access on %I" ON public.%I', t, t);
  END LOOP;
END $$;

-- Profiles: authenticated users can read profiles, but only create/edit their own profile
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = id)
  WITH CHECK ((SELECT auth.uid())::text = id);

-- Matches: readable by authenticated players; created/deleted by organizer (plus initial demo fixtures)
DROP POLICY IF EXISTS "matches_select_authenticated" ON public.matches;
CREATE POLICY "matches_select_authenticated" ON public.matches
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "matches_insert_authenticated" ON public.matches;
CREATE POLICY "matches_insert_authenticated" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid())::text = organizer_id
    OR id IN ('match_1', 'match_2', 'match_3', 'match_4')
  );

DROP POLICY IF EXISTS "matches_update_authenticated" ON public.matches;
CREATE POLICY "matches_update_authenticated" ON public.matches
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "matches_delete_organizer" ON public.matches;
CREATE POLICY "matches_delete_organizer" ON public.matches
  FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid())::text = organizer_id
    OR id IN ('match_1', 'match_2', 'match_3', 'match_4')
  );

-- Roster Slots: readable/updatable by authenticated players; created/deleted by match organizer
DROP POLICY IF EXISTS "roster_slots_select_authenticated" ON public.roster_slots;
CREATE POLICY "roster_slots_select_authenticated" ON public.roster_slots
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "roster_slots_insert_organizer" ON public.roster_slots;
CREATE POLICY "roster_slots_insert_organizer" ON public.roster_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (
          m.organizer_id = (SELECT auth.uid())::text
          OR m.id IN ('match_1', 'match_2', 'match_3', 'match_4')
        )
    )
  );

DROP POLICY IF EXISTS "roster_slots_update_authenticated" ON public.roster_slots;
CREATE POLICY "roster_slots_update_authenticated" ON public.roster_slots
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roster_slots_delete_organizer" ON public.roster_slots;
CREATE POLICY "roster_slots_delete_organizer" ON public.roster_slots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND (
          m.organizer_id = (SELECT auth.uid())::text
          OR m.id IN ('match_1', 'match_2', 'match_3', 'match_4')
        )
    )
  );

-- Join Requests: visible to requester and match captain; created by requester; updated by captain
DROP POLICY IF EXISTS "join_requests_select_participant" ON public.join_requests;
CREATE POLICY "join_requests_select_participant" ON public.join_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "join_requests_insert_requester" ON public.join_requests;
CREATE POLICY "join_requests_insert_requester" ON public.join_requests
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = requester_id);

DROP POLICY IF EXISTS "join_requests_update_captain" ON public.join_requests;
CREATE POLICY "join_requests_update_captain" ON public.join_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "join_requests_delete_participant" ON public.join_requests;
CREATE POLICY "join_requests_delete_participant" ON public.join_requests
  FOR DELETE TO authenticated
  USING (
    requester_id = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())::text
    )
  );

-- Leagues, Teams & Fixtures: collaborative access for authenticated users
DROP POLICY IF EXISTS "leagues_select_authenticated" ON public.leagues;
CREATE POLICY "leagues_select_authenticated" ON public.leagues
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leagues_insert_authenticated" ON public.leagues;
CREATE POLICY "leagues_insert_authenticated" ON public.leagues
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "leagues_update_authenticated" ON public.leagues;
CREATE POLICY "leagues_update_authenticated" ON public.leagues
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "leagues_delete_seed" ON public.leagues;
CREATE POLICY "leagues_delete_seed" ON public.leagues
  FOR DELETE TO authenticated USING (id IN ('league_1', 'league_2', 'league_3'));

DROP POLICY IF EXISTS "league_teams_select_authenticated" ON public.league_teams;
CREATE POLICY "league_teams_select_authenticated" ON public.league_teams
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "league_teams_insert_authenticated" ON public.league_teams;
CREATE POLICY "league_teams_insert_authenticated" ON public.league_teams
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "league_teams_update_authenticated" ON public.league_teams;
CREATE POLICY "league_teams_update_authenticated" ON public.league_teams
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "league_teams_delete_seed" ON public.league_teams;
CREATE POLICY "league_teams_delete_seed" ON public.league_teams
  FOR DELETE TO authenticated USING (league_id IN ('league_1', 'league_2', 'league_3'));

DROP POLICY IF EXISTS "league_fixtures_select_authenticated" ON public.league_fixtures;
CREATE POLICY "league_fixtures_select_authenticated" ON public.league_fixtures
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "league_fixtures_insert_authenticated" ON public.league_fixtures;
CREATE POLICY "league_fixtures_insert_authenticated" ON public.league_fixtures
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "league_fixtures_update_authenticated" ON public.league_fixtures;
CREATE POLICY "league_fixtures_update_authenticated" ON public.league_fixtures
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "league_fixtures_delete_seed" ON public.league_fixtures;
CREATE POLICY "league_fixtures_delete_seed" ON public.league_fixtures
  FOR DELETE TO authenticated USING (league_id IN ('league_1', 'league_2', 'league_3'));

-- Player Evaluations: readable by authenticated players; created/deleted by evaluator
DROP POLICY IF EXISTS "evaluations_select_authenticated" ON public.player_evaluations;
CREATE POLICY "evaluations_select_authenticated" ON public.player_evaluations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "evaluations_insert_own" ON public.player_evaluations;
CREATE POLICY "evaluations_insert_own" ON public.player_evaluations
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = evaluator_id OR id IN ('eval_1', 'eval_2'));

DROP POLICY IF EXISTS "evaluations_delete_own" ON public.player_evaluations;
CREATE POLICY "evaluations_delete_own" ON public.player_evaluations
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = evaluator_id OR id IN ('eval_1', 'eval_2'));

-- Gear Items: readable by authenticated players; managed by seller
DROP POLICY IF EXISTS "gear_select_authenticated" ON public.gear_items;
CREATE POLICY "gear_select_authenticated" ON public.gear_items
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "gear_insert_own" ON public.gear_items;
CREATE POLICY "gear_insert_own" ON public.gear_items
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = seller_id OR id IN ('gear_1', 'gear_2', 'gear_3', 'gear_4'));

DROP POLICY IF EXISTS "gear_update_own" ON public.gear_items;
CREATE POLICY "gear_update_own" ON public.gear_items
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = seller_id OR id IN ('gear_1', 'gear_2', 'gear_3', 'gear_4'))
  WITH CHECK ((SELECT auth.uid())::text = seller_id OR id IN ('gear_1', 'gear_2', 'gear_3', 'gear_4'));

DROP POLICY IF EXISTS "gear_delete_own" ON public.gear_items;
CREATE POLICY "gear_delete_own" ON public.gear_items
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = seller_id OR id IN ('gear_1', 'gear_2', 'gear_3', 'gear_4'));
