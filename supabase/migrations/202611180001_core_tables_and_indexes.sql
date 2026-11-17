-- Phase 2: Normalized UUID Relational Schema, Constraints & Indexes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Public Player Profiles (No private contact info here; matches auth.users.id)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')) DEFAULT 'MID',
  rating NUMERIC(3,2) NOT NULL DEFAULT 4.80 CHECK (rating BETWEEN 1.00 AND 5.00),
  fair_play_rating NUMERIC(3,2) NOT NULL DEFAULT 4.90 CHECK (fair_play_rating BETWEEN 1.00 AND 5.00),
  matches_played INT NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
  preferred_foot TEXT NOT NULL CHECK (preferred_foot IN ('Right', 'Left', 'Both')) DEFAULT 'Right',
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL DEFAULT 'Kadıköy',
  avatar_url TEXT,
  bio TEXT,
  prediction_score INT NOT NULL DEFAULT 0 CHECK (prediction_score >= 0),
  total_predictions INT NOT NULL DEFAULT 0 CHECK (total_predictions >= 0),
  correct_predictions INT NOT NULL DEFAULT 0 CHECK (correct_predictions >= 0),
  evaluations_count INT NOT NULL DEFAULT 0 CHECK (evaluations_count >= 0),
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_city_district ON public.profiles(city, district);

-- 2. Private User Contacts & Notification Settings (Strictly owner-only RLS)
CREATE TABLE public.profile_contacts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  expo_push_token TEXT,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Standalone Teams & Team Memberships
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  logo_emoji TEXT NOT NULL DEFAULT '⚽',
  captain_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL DEFAULT 'Kadıköy',
  format TEXT NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')) DEFAULT '7v7',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_captain_id ON public.teams(captain_id);
CREATE UNIQUE INDEX uq_teams_district_name ON public.teams(LOWER(district), LOWER(trim(name)));

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('CAPTAIN', 'PLAYER')) DEFAULT 'PLAYER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, player_id)
);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_player_id ON public.team_members(player_id);

-- 4. Regional Leagues, League Teams & Fixtures
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  season TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')),
  status TEXT NOT NULL CHECK (status IN ('REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'REGISTRATION_OPEN',
  max_teams INT NOT NULL CHECK (max_teams BETWEEN 2 AND 64),
  registered_teams_count INT NOT NULL DEFAULT 0 CHECK (registered_teams_count >= 0 AND registered_teams_count <= max_teams),
  entry_fee INT NOT NULL DEFAULT 0 CHECK (entry_fee >= 0),
  prize TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT,
  description TEXT NOT NULL,
  rules TEXT[] NOT NULL DEFAULT '{}',
  theme_color TEXT NOT NULL DEFAULT '#16A34A',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leagues_organizer_id ON public.leagues(organizer_id);
CREATE INDEX idx_leagues_district_status ON public.leagues(district, status);

CREATE TABLE public.league_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  logo_emoji TEXT NOT NULL DEFAULT '⚽',
  captain_name TEXT NOT NULL,
  captain_phone TEXT,
  played INT NOT NULL DEFAULT 0 CHECK (played >= 0),
  won INT NOT NULL DEFAULT 0 CHECK (won >= 0),
  drawn INT NOT NULL DEFAULT 0 CHECK (drawn >= 0),
  lost INT NOT NULL DEFAULT 0 CHECK (lost >= 0),
  goals_for INT NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
  goals_against INT NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  form TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_league_teams_league_points ON public.league_teams(league_id, points DESC, goal_difference DESC);
CREATE INDEX idx_league_teams_team_id ON public.league_teams(team_id);
CREATE INDEX idx_league_teams_captain_id ON public.league_teams(captain_id);
CREATE UNIQUE INDEX uq_league_teams_league_name ON public.league_teams(league_id, LOWER(trim(name)));
CREATE UNIQUE INDEX uq_league_teams_league_team_id ON public.league_teams(league_id, team_id) WHERE team_id IS NOT NULL;

CREATE TABLE public.league_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  week INT NOT NULL CHECK (week >= 1),
  home_league_team_id UUID REFERENCES public.league_teams(id) ON DELETE CASCADE,
  away_league_team_id UUID REFERENCES public.league_teams(id) ON DELETE CASCADE,
  home_team_name TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  home_score INT CHECK (home_score >= 0),
  away_score INT CHECK (away_score >= 0),
  date_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  venue TEXT NOT NULL,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (home_league_team_id IS NULL OR away_league_team_id IS NULL OR home_league_team_id <> away_league_team_id)
);

CREATE INDEX idx_league_fixtures_league_week ON public.league_fixtures(league_id, week);
CREATE INDEX idx_league_fixtures_home_team ON public.league_fixtures(home_league_team_id);
CREATE INDEX idx_league_fixtures_away_team ON public.league_fixtures(away_league_team_id);

-- 5. Matches, Votes, Roster Slots & Join Requests
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT,
  venue_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL,
  date_label TEXT NOT NULL,
  time_range TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('5v5', '6v6', '7v7', '8v8')),
  pitch_type TEXT NOT NULL CHECK (pitch_type IN ('Açık Saha', 'Kapalı Saha')),
  fee_per_player INT NOT NULL CHECK (fee_per_player >= 0),
  total_slots INT NOT NULL CHECK (total_slots IN (10, 12, 14, 16)),
  missing_positions TEXT[] NOT NULL DEFAULT '{}',
  team1_name TEXT NOT NULL DEFAULT 'Ev Sahibi',
  team2_name TEXT NOT NULL DEFAULT 'Deplasman',
  prediction_category TEXT NOT NULL CHECK (prediction_category IN ('Derbi', 'Haftanın Maçı', 'Normal')) DEFAULT 'Normal',
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'FULL', 'COMPLETED', 'CANCELLED')) DEFAULT 'OPEN',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  final_score_team1 INT CHECK (final_score_team1 >= 0),
  final_score_team2 INT CHECK (final_score_team2 >= 0),
  matchup_stats JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_organizer_id ON public.matches(organizer_id);
CREATE INDEX idx_matches_district_status ON public.matches(district, status);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);

CREATE TABLE public.match_prediction_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('1', 'X', '2')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX idx_match_prediction_votes_match ON public.match_prediction_votes(match_id);
CREATE INDEX idx_match_prediction_votes_user ON public.match_prediction_votes(user_id);

CREATE TABLE public.roster_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot_order INT NOT NULL CHECK (slot_order >= 0),
  team_side SMALLINT NOT NULL CHECK (team_side IN (1, 2)) DEFAULT 1,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  is_filled BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_player_name TEXT,
  assigned_player_rating NUMERIC(3,2),
  assigned_player_fair_play NUMERIC(3,2),
  is_organizer BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, slot_order)
);

CREATE INDEX idx_roster_slots_match_order ON public.roster_slots(match_id, slot_order);
CREATE INDEX idx_roster_slots_assigned_player ON public.roster_slots(assigned_player_id);
CREATE UNIQUE INDEX uq_roster_slots_match_player ON public.roster_slots(match_id, assigned_player_id)
  WHERE assigned_player_id IS NOT NULL;

CREATE TABLE public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.roster_slots(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_rating NUMERIC(3,2) NOT NULL DEFAULT 4.80,
  requester_fair_play NUMERIC(3,2) NOT NULL DEFAULT 4.90,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_join_requests_match_status ON public.join_requests(match_id, status);
CREATE INDEX idx_join_requests_slot_id ON public.join_requests(slot_id);
CREATE INDEX idx_join_requests_requester_id ON public.join_requests(requester_id);
CREATE UNIQUE INDEX uq_join_requests_pending ON public.join_requests(match_id, requester_id)
  WHERE status = 'PENDING';

-- 6. Second-Hand Equipment Marketplace
CREATE TABLE public.gear_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_phone TEXT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Boots', 'Jerseys', 'Gloves', 'Equipment')),
  brand TEXT NOT NULL,
  size TEXT NOT NULL,
  price INT NOT NULL CHECK (price > 0),
  condition TEXT NOT NULL CHECK (condition IN ('Sıfır (Etiketli)', 'Çok İyi (Az Kullanılmış)', 'İyi', 'Kullanılmış')),
  city TEXT NOT NULL DEFAULT 'İstanbul',
  district TEXT NOT NULL DEFAULT 'Kadıköy',
  location TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Sold')) DEFAULT 'Available',
  icon_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gear_items_seller_id ON public.gear_items(seller_id);
CREATE INDEX idx_gear_items_status_cat ON public.gear_items(status, category, created_at DESC);
CREATE INDEX idx_gear_items_city_district ON public.gear_items(city, district);

-- 7. Post-Match Player & Fair-Play Evaluations
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  match_title TEXT NOT NULL,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  evaluator_name TEXT NOT NULL,
  target_player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_player_name TEXT NOT NULL,
  target_player_position TEXT CHECK (target_player_position IN ('GK', 'DEF', 'MID', 'FWD')),
  is_opponent BOOLEAN NOT NULL DEFAULT TRUE,
  skill_rating INT NOT NULL CHECK (skill_rating BETWEEN 1 AND 5),
  fair_play_rating INT NOT NULL CHECK (fair_play_rating BETWEEN 1 AND 5),
  badges TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (evaluator_id <> target_player_id),
  UNIQUE (match_id, evaluator_id, target_player_id)
);

CREATE INDEX idx_evaluations_match_id ON public.evaluations(match_id);
CREATE INDEX idx_evaluations_evaluator_id ON public.evaluations(evaluator_id);
CREATE INDEX idx_evaluations_target_player_id ON public.evaluations(target_player_id);

-- 8. Notifications (Realtime & Push Deduplicated Inbox)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'JOIN_REQUEST_RECEIVED',
      'JOIN_REQUEST_APPROVED',
      'JOIN_REQUEST_REJECTED',
      'MATCH_UPDATED',
      'LEAGUE_UPDATED',
      'GEAR_UPDATED'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('MATCH', 'JOIN_REQUEST', 'LEAGUE', 'GEAR', 'EVALUATION')),
  entity_id UUID,
  dedupe_key TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, is_read, created_at DESC);
CREATE UNIQUE INDEX uq_notifications_dedupe ON public.notifications(user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- 9. Moderation Reports (Spam/Abuse Prevention)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('PLAYER', 'MATCH', 'GEAR', 'LEAGUE')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 3),
  details TEXT,
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'RESOLVED', 'DISMISSED')) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporter_id, target_type, target_id)
);

CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_target ON public.reports(target_type, target_id);
