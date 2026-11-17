-- Phase 2: Server-Side Triggers, Validation Functions, Standings Engine & Atomic RPCs

-- 1. Generic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'profile_contacts',
    'teams',
    'leagues',
    'league_teams',
    'league_fixtures',
    'matches',
    'match_prediction_votes',
    'roster_slots',
    'join_requests',
    'gear_items',
    'reports'
  ] LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl,
      tbl
    );
  END LOOP;
END $$;

-- 2. Auth User -> Public Profile + Private Contacts auto-creation
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
  IF char_length(v_name) < 2 THEN
    v_name := 'Yeni Oyuncu';
  END IF;

  v_position := COALESCE(NEW.raw_user_meta_data ->> 'position', 'MID');
  IF v_position NOT IN ('GK', 'DEF', 'MID', 'FWD') THEN
    v_position := 'MID';
  END IF;

  v_city := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'city'), ''), 'İstanbul');
  v_district := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'district'), ''), 'Kadıköy');

  INSERT INTO public.profiles (id, name, position, city, district)
  VALUES (NEW.id, v_name, v_position, v_city, v_district)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_contacts (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Post-Match Evaluation Validation & Rating Aggregation Triggers
CREATE OR REPLACE FUNCTION public.validate_evaluation_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_completed BOOLEAN;
BEGIN
  IF NEW.evaluator_id = NEW.target_player_id THEN
    RAISE EXCEPTION 'Users cannot evaluate themselves';
  END IF;

  SELECT is_completed INTO v_is_completed
  FROM public.matches
  WHERE id = NEW.match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_is_completed IS NOT TRUE THEN
    RAISE EXCEPTION 'Evaluations can only be submitted after a match is completed';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_evaluations_validate
  BEFORE INSERT ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.validate_evaluation_before_insert();

CREATE OR REPLACE FUNCTION public.recalculate_player_ratings_after_eval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_avg_skill NUMERIC(3,2);
  v_avg_fp NUMERIC(3,2);
  v_count INT;
  v_badges JSONB;
BEGIN
  SELECT
    ROUND(AVG(skill_rating)::numeric, 2),
    ROUND(AVG(fair_play_rating)::numeric, 2),
    COUNT(*)::int
  INTO v_avg_skill, v_avg_fp, v_count
  FROM public.evaluations
  WHERE target_player_id = NEW.target_player_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', badge_code,
        'label', badge_code,
        'icon', '',
        'count', badge_count
      )
      ORDER BY badge_count DESC, badge_code ASC
    ),
    '[]'::jsonb
  )
  INTO v_badges
  FROM (
    SELECT unnest(badges) AS badge_code, COUNT(*)::int AS badge_count
    FROM public.evaluations
    WHERE target_player_id = NEW.target_player_id
    GROUP BY badge_code
  ) b;

  UPDATE public.profiles
  SET
    rating = COALESCE(v_avg_skill, rating),
    fair_play_rating = COALESCE(v_avg_fp, fair_play_rating),
    evaluations_count = COALESCE(v_count, evaluations_count),
    badges = COALESCE(v_badges, badges)
  WHERE id = NEW.target_player_id;

  -- Award Fair-Play community contribution points server-side
  UPDATE public.profiles
  SET prediction_score = prediction_score + 15
  WHERE id = NEW.evaluator_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_evaluations_recalc
  AFTER INSERT ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_player_ratings_after_eval();

-- 4. Notification Triggers (Join Request Created, Match Updated, Gear Updated)
CREATE OR REPLACE FUNCTION public.notify_on_join_request_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match
  FROM public.matches
  WHERE id = NEW.match_id;

  IF FOUND AND v_match.organizer_id <> NEW.requester_id THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, entity_type, entity_id, dedupe_key
    )
    VALUES (
      v_match.organizer_id,
      'JOIN_REQUEST_RECEIVED',
      'Yeni Kadro Başvurusu',
      NEW.requester_name || ' (' || NEW.position || ') "' || v_match.title || '" maçına katılmak istiyor.',
      'JOIN_REQUEST',
      NEW.id,
      'jr_recv_' || NEW.id::text
    )
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_join_requests_notify
  AFTER INSERT ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_join_request_insert();

CREATE OR REPLACE FUNCTION public.notify_on_match_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (
    OLD.venue_name IS DISTINCT FROM NEW.venue_name
    OR OLD.date_label IS DISTINCT FROM NEW.date_label
    OR OLD.time_range IS DISTINCT FROM NEW.time_range
    OR OLD.status IS DISTINCT FROM NEW.status
    OR OLD.is_completed IS DISTINCT FROM NEW.is_completed
  ) THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, entity_type, entity_id, dedupe_key
    )
    SELECT DISTINCT
      rs.assigned_player_id,
      'MATCH_UPDATED',
      CASE
        WHEN NEW.status = 'CANCELLED' THEN 'Maç İptal Edildi'
        WHEN NEW.is_completed AND NOT OLD.is_completed THEN 'Maç Tamamlandı'
        ELSE 'Maç Bilgisi Güncellendi'
      END,
      '"' || NEW.title || '" maçının detayları güncellendi (' || NEW.date_label || ', ' || NEW.time_range || ').',
      'MATCH',
      NEW.id,
      'match_upd_' || NEW.id::text || '_' || extract(epoch from NOW())::bigint::text
    FROM public.roster_slots rs
    WHERE rs.match_id = NEW.id
      AND rs.assigned_player_id IS NOT NULL
      AND rs.assigned_player_id <> NEW.organizer_id
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_matches_notify
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_match_update();

CREATE OR REPLACE FUNCTION public.notify_on_gear_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'Available' AND NEW.status = 'Sold' THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, entity_type, entity_id, dedupe_key
    )
    VALUES (
      NEW.seller_id,
      'GEAR_UPDATED',
      'İlan Satıldı Olarak İşaretlendi',
      '"' || NEW.title || '" ilanınız satıldı durumuna geçirildi.',
      'GEAR',
      NEW.id,
      'gear_sold_' || NEW.id::text
    )
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_gear_notify
  AFTER UPDATE ON public.gear_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_gear_update();

-- 5. Match Roster Helper & Atomic RPCs
CREATE OR REPLACE FUNCTION public.sync_match_missing_positions(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_missing TEXT[];
  v_open_count INT;
  v_cur_status TEXT;
BEGIN
  SELECT status INTO v_cur_status
  FROM public.matches
  WHERE id = p_match_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(ARRAY_AGG(position ORDER BY slot_order), '{}'),
    COUNT(*)
  INTO v_missing, v_open_count
  FROM public.roster_slots
  WHERE match_id = p_match_id
    AND team_side = 1
    AND is_filled = FALSE;

  UPDATE public.matches
  SET
    missing_positions = v_missing,
    status = CASE
      WHEN v_cur_status IN ('COMPLETED', 'CANCELLED') THEN v_cur_status
      WHEN v_open_count = 0 THEN 'FULL'
      ELSE 'OPEN'
    END
  WHERE id = p_match_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_join_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_req public.join_requests%ROWTYPE;
  v_match public.matches%ROWTYPE;
  v_chosen_slot_id UUID;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
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

  IF NOT FOUND OR v_match.organizer_id <> v_caller THEN
    RETURN FALSE;
  END IF;

  IF v_match.is_completed OR v_match.status = 'CANCELLED' THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.roster_slots
    WHERE match_id = v_req.match_id AND assigned_player_id = v_req.requester_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Try requested slot first, else another unfilled slot of same position in team_side 1
  SELECT id INTO v_chosen_slot_id
  FROM public.roster_slots
  WHERE match_id = v_req.match_id
    AND id = v_req.slot_id
    AND team_side = 1
    AND is_filled = FALSE
  FOR UPDATE;

  IF v_chosen_slot_id IS NULL THEN
    SELECT id INTO v_chosen_slot_id
    FROM public.roster_slots
    WHERE match_id = v_req.match_id
      AND team_side = 1
      AND position = v_req.position
      AND is_filled = FALSE
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
    assigned_player_rating = v_req.requester_rating,
    assigned_player_fair_play = v_req.requester_fair_play
  WHERE id = v_chosen_slot_id;

  PERFORM public.sync_match_missing_positions(v_req.match_id);

  UPDATE public.join_requests
  SET
    slot_id = v_chosen_slot_id,
    status = 'APPROVED',
    responded_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (
    user_id, type, title, body, entity_type, entity_id, dedupe_key
  )
  VALUES (
    v_req.requester_id,
    'JOIN_REQUEST_APPROVED',
    'Kadro Başvurun Onaylandı',
    '"' || v_match.title || '" maçındaki ' || v_req.position || ' mevki başvurun kaptan tarafından onaylandı.',
    'MATCH',
    v_match.id,
    'jr_appr_' || p_request_id::text
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_join_request(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_req public.join_requests%ROWTYPE;
  v_match public.matches%ROWTYPE;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
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
  WHERE id = v_req.match_id;

  IF NOT FOUND OR v_match.organizer_id <> v_caller THEN
    RETURN FALSE;
  END IF;

  UPDATE public.join_requests
  SET status = 'REJECTED', responded_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (
    user_id, type, title, body, entity_type, entity_id, dedupe_key
  )
  VALUES (
    v_req.requester_id,
    'JOIN_REQUEST_REJECTED',
    'Başvuru Sonucu',
    '"' || v_match.title || '" maçı için gönderdiğin ' || v_req.position || ' mevki isteği onaylanmadı.',
    'MATCH',
    v_match.id,
    'jr_rej_' || p_request_id::text
  )
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_match_slot_atomic(
  p_match_id UUID,
  p_slot_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_match public.matches%ROWTYPE;
  v_slot public.roster_slots%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND OR v_match.organizer_id <> v_caller THEN
    RETURN FALSE;
  END IF;

  IF v_match.is_completed OR v_match.status = 'CANCELLED' THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.roster_slots
    WHERE match_id = p_match_id AND assigned_player_id = v_caller
  ) THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_slot
  FROM public.roster_slots
  WHERE id = p_slot_id AND match_id = p_match_id AND is_filled = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_caller;

  UPDATE public.roster_slots
  SET
    is_filled = TRUE,
    assigned_player_id = v_caller,
    assigned_player_name = COALESCE(v_profile.name, 'Kaptan'),
    assigned_player_rating = COALESCE(v_profile.rating, 4.80),
    assigned_player_fair_play = COALESCE(v_profile.fair_play_rating, 4.90),
    is_organizer = TRUE
  WHERE id = v_slot.id;

  PERFORM public.sync_match_missing_positions(p_match_id);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_match_atomic(p_match_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_updated INT;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.roster_slots
  SET
    is_filled = FALSE,
    assigned_player_id = NULL,
    assigned_player_name = NULL,
    assigned_player_rating = NULL,
    assigned_player_fair_play = NULL,
    is_organizer = FALSE
  WHERE match_id = p_match_id
    AND assigned_player_id = v_caller;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.join_requests
  SET status = 'CANCELLED', responded_at = NOW()
  WHERE match_id = p_match_id
    AND requester_id = v_caller
    AND status = 'APPROVED';

  PERFORM public.sync_match_missing_positions(p_match_id);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_match_atomic(
  p_match_id UUID,
  p_score_team1 INT,
  p_score_team2 INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_match public.matches%ROWTYPE;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_score_team1 < 0 OR p_score_team2 < 0 THEN
    RAISE EXCEPTION 'Scores must be non-negative';
  END IF;

  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND OR v_match.organizer_id <> v_caller THEN
    RETURN FALSE;
  END IF;

  UPDATE public.matches
  SET
    is_completed = TRUE,
    status = 'COMPLETED',
    final_score_team1 = p_score_team1,
    final_score_team2 = p_score_team2
  WHERE id = p_match_id;

  IF NOT v_match.is_completed THEN
    UPDATE public.profiles p
    SET matches_played = p.matches_played + 1
    WHERE EXISTS (
      SELECT 1 FROM public.roster_slots rs
      WHERE rs.match_id = p_match_id AND rs.assigned_player_id = p.id
    );
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cast_match_prediction_vote(
  p_match_id UUID,
  p_choice TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_existed BOOLEAN;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_choice NOT IN ('1', 'X', '2') THEN
    RAISE EXCEPTION 'Invalid prediction choice';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.match_prediction_votes
    WHERE match_id = p_match_id AND user_id = v_caller
  ) INTO v_existed;

  INSERT INTO public.match_prediction_votes (match_id, user_id, choice)
  VALUES (p_match_id, v_caller, p_choice)
  ON CONFLICT (match_id, user_id)
  DO UPDATE SET choice = EXCLUDED.choice, updated_at = NOW();

  IF NOT v_existed THEN
    UPDATE public.profiles
    SET
      prediction_score = prediction_score + 25,
      total_predictions = total_predictions + 1
    WHERE id = v_caller;
  END IF;

  RETURN TRUE;
END;
$$;

-- 6. League Registration & Standings Recalculation RPCs
CREATE OR REPLACE FUNCTION public.register_team_to_league(
  p_league_id UUID,
  p_team_name TEXT,
  p_captain_name TEXT,
  p_captain_phone TEXT DEFAULT NULL,
  p_team_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_league public.leagues%ROWTYPE;
  v_new_team_id UUID;
  v_next_count INT;
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF char_length(trim(p_team_name)) < 2 THEN
    RAISE EXCEPTION 'Team name must be at least 2 characters';
  END IF;

  SELECT * INTO v_league
  FROM public.leagues
  WHERE id = p_league_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'League not found';
  END IF;

  IF v_league.status <> 'REGISTRATION_OPEN' OR v_league.registered_teams_count >= v_league.max_teams THEN
    RAISE EXCEPTION 'League registration is full or closed';
  END IF;

  INSERT INTO public.league_teams (
    league_id, team_id, captain_id, name, captain_name, captain_phone
  )
  VALUES (
    p_league_id,
    p_team_id,
    v_caller,
    trim(p_team_name),
    COALESCE(NULLIF(trim(p_captain_name), ''), 'Kaptan'),
    NULLIF(trim(COALESCE(p_captain_phone, '')), '')
  )
  RETURNING id INTO v_new_team_id;

  v_next_count := v_league.registered_teams_count + 1;

  UPDATE public.leagues
  SET
    registered_teams_count = v_next_count,
    status = CASE WHEN v_next_count >= max_teams THEN 'IN_PROGRESS' ELSE status END
  WHERE id = p_league_id;

  IF v_league.organizer_id <> v_caller THEN
    INSERT INTO public.notifications (
      user_id, type, title, body, entity_type, entity_id, dedupe_key
    )
    VALUES (
      v_league.organizer_id,
      'LEAGUE_UPDATED',
      'Lige Yeni Takım Katıldı',
      trim(p_team_name) || ' takımı "' || v_league.title || '" ligine kayıt oldu.',
      'LEAGUE',
      p_league_id,
      'league_join_' || v_new_team_id::text
    )
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
  END IF;

  RETURN v_new_team_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_league_fixture_result(
  p_fixture_id UUID,
  p_home_score INT,
  p_away_score INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller UUID;
  v_fixture public.league_fixtures%ROWTYPE;
  v_league public.leagues%ROWTYPE;
  v_team RECORD;
  v_played INT;
  v_won INT;
  v_drawn INT;
  v_lost INT;
  v_gf INT;
  v_ga INT;
  v_form TEXT[];
BEGIN
  v_caller := (SELECT auth.uid());
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_home_score < 0 OR p_away_score < 0 THEN
    RAISE EXCEPTION 'Scores must be non-negative';
  END IF;

  SELECT * INTO v_fixture
  FROM public.league_fixtures
  WHERE id = p_fixture_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_league
  FROM public.leagues
  WHERE id = v_fixture.league_id
  FOR UPDATE;

  IF NOT FOUND OR v_league.organizer_id <> v_caller THEN
    RETURN FALSE;
  END IF;

  UPDATE public.league_fixtures
  SET
    home_score = p_home_score,
    away_score = p_away_score,
    is_finished = TRUE
  WHERE id = p_fixture_id;

  -- Recalculate standings consistently for every team in this league
  FOR v_team IN
    SELECT id, name FROM public.league_teams WHERE league_id = v_league.id
  LOOP
    SELECT
      COUNT(*)::int,
      COALESCE(SUM(CASE
        WHEN (home_league_team_id = v_team.id AND home_score > away_score)
          OR (away_league_team_id = v_team.id AND away_score > home_score) THEN 1 ELSE 0
      END), 0)::int,
      COALESCE(SUM(CASE WHEN home_score = away_score THEN 1 ELSE 0 END), 0)::int,
      COALESCE(SUM(CASE
        WHEN (home_league_team_id = v_team.id AND home_score < away_score)
          OR (away_league_team_id = v_team.id AND away_score < home_score) THEN 1 ELSE 0
      END), 0)::int,
      COALESCE(SUM(CASE
        WHEN home_league_team_id = v_team.id THEN home_score
        ELSE away_score
      END), 0)::int,
      COALESCE(SUM(CASE
        WHEN home_league_team_id = v_team.id THEN away_score
        ELSE home_score
      END), 0)::int
    INTO v_played, v_won, v_drawn, v_lost, v_gf, v_ga
    FROM public.league_fixtures
    WHERE league_id = v_league.id
      AND is_finished = TRUE
      AND home_score IS NOT NULL
      AND away_score IS NOT NULL
      AND (home_league_team_id = v_team.id OR away_league_team_id = v_team.id);

    SELECT COALESCE(ARRAY_AGG(res), '{}')
    INTO v_form
    FROM (
      SELECT CASE
        WHEN (home_league_team_id = v_team.id AND home_score > away_score)
          OR (away_league_team_id = v_team.id AND away_score > home_score) THEN 'W'
        WHEN home_score = away_score THEN 'D'
        ELSE 'L'
      END AS res
      FROM public.league_fixtures
      WHERE league_id = v_league.id
        AND is_finished = TRUE
        AND home_score IS NOT NULL
        AND away_score IS NOT NULL
        AND (home_league_team_id = v_team.id OR away_league_team_id = v_team.id)
      ORDER BY week DESC, updated_at DESC
      LIMIT 5
    ) recent_rev;

    UPDATE public.league_teams
    SET
      played = v_played,
      won = v_won,
      drawn = v_drawn,
      lost = v_lost,
      goals_for = v_gf,
      goals_against = v_ga,
      goal_difference = v_gf - v_ga,
      points = (v_won * 3) + v_drawn,
      form = COALESCE(v_form, '{}')
    WHERE id = v_team.id;
  END LOOP;

  -- Notify captains of the two participating teams
  INSERT INTO public.notifications (
    user_id, type, title, body, entity_type, entity_id, dedupe_key
  )
  SELECT DISTINCT
    lt.captain_id,
    'LEAGUE_UPDATED',
    'Maç Sonucu Girildi',
    v_fixture.home_team_name || ' ' || p_home_score || ' - ' || p_away_score || ' ' || v_fixture.away_team_name || ' (' || v_league.title || ')',
    'LEAGUE',
    v_league.id,
    'fix_res_' || p_fixture_id::text || '_' || p_home_score::text || '_' || p_away_score::text
  FROM public.league_teams lt
  WHERE lt.id IN (v_fixture.home_league_team_id, v_fixture.away_league_team_id)
    AND lt.captain_id IS NOT NULL
    AND lt.captain_id <> v_caller
  ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;

  RETURN TRUE;
END;
$$;
