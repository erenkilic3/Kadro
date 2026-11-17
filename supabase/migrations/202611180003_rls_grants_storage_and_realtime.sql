-- Phase 2: Strict Row Level Security, Least-Privilege Grants, Storage Buckets & Realtime

-- 1. Revoke default public privileges and apply minimal role grants
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profile_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leagues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.league_fixtures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_prediction_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roster_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.join_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gear_items TO authenticated;
GRANT SELECT, INSERT ON public.evaluations TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;

-- Restrict helper & trigger functions and grant RPCs only to authenticated users
REVOKE ALL ON FUNCTION public.sync_match_missing_positions(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_join_request(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_join_request(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_match_slot_atomic(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_match_atomic(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_match_atomic(UUID, INT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cast_match_prediction_vote(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_team_to_league(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_league_fixture_result(UUID, INT, INT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_join_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_match_slot_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_match_atomic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_match_atomic(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_match_prediction_vote(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_team_to_league(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_league_fixture_result(UUID, INT, INT) TO authenticated;

-- 2. Enable Row Level Security on every table in public
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_prediction_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Profiles & Private Contacts Policies
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profile_contacts_select_own" ON public.profile_contacts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "profile_contacts_insert_own" ON public.profile_contacts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "profile_contacts_update_own" ON public.profile_contacts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. Teams & Team Members Policies
CREATE POLICY "teams_select_authenticated" ON public.teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "teams_insert_captain" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = captain_id);

CREATE POLICY "teams_update_captain" ON public.teams
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = captain_id)
  WITH CHECK ((SELECT auth.uid()) = captain_id);

CREATE POLICY "teams_delete_captain" ON public.teams
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = captain_id);

CREATE POLICY "team_members_select_authenticated" ON public.team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "team_members_insert_captain" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.captain_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "team_members_delete_captain_or_self" ON public.team_members
  FOR DELETE TO authenticated
  USING (
    player_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.captain_id = (SELECT auth.uid())
    )
  );

-- 5. Leagues, League Teams & League Fixtures Policies
CREATE POLICY "leagues_select_authenticated" ON public.leagues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "leagues_insert_organizer" ON public.leagues
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "leagues_update_organizer" ON public.leagues
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = organizer_id)
  WITH CHECK ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "leagues_delete_organizer" ON public.leagues
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "league_teams_select_authenticated" ON public.league_teams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "league_teams_insert_organizer" ON public.league_teams
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "league_teams_update_captain_or_organizer" ON public.league_teams
  FOR UPDATE TO authenticated
  USING (
    captain_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    captain_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "league_teams_delete_captain_or_organizer" ON public.league_teams
  FOR DELETE TO authenticated
  USING (
    captain_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "league_fixtures_select_authenticated" ON public.league_fixtures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "league_fixtures_insert_organizer" ON public.league_fixtures
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "league_fixtures_update_organizer" ON public.league_fixtures
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "league_fixtures_delete_organizer" ON public.league_fixtures
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_id AND l.organizer_id = (SELECT auth.uid())
    )
  );

-- 6. Matches, Votes, Roster Slots & Join Requests Policies
CREATE POLICY "matches_select_authenticated" ON public.matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "matches_insert_organizer" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "matches_update_organizer" ON public.matches
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = organizer_id)
  WITH CHECK ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "matches_delete_organizer" ON public.matches
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = organizer_id);

CREATE POLICY "match_votes_select_authenticated" ON public.match_prediction_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "match_votes_insert_own" ON public.match_prediction_votes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "match_votes_update_own" ON public.match_prediction_votes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "match_votes_delete_own" ON public.match_prediction_votes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "roster_slots_select_authenticated" ON public.roster_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "roster_slots_insert_organizer" ON public.roster_slots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "roster_slots_update_organizer" ON public.roster_slots
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "roster_slots_delete_organizer" ON public.roster_slots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "join_requests_select_participant" ON public.join_requests
  FOR SELECT TO authenticated
  USING (
    requester_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "join_requests_insert_requester" ON public.join_requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = (SELECT auth.uid()));

CREATE POLICY "join_requests_update_captain_or_cancel" ON public.join_requests
  FOR UPDATE TO authenticated
  USING (
    requester_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (requester_id = (SELECT auth.uid()) AND status = 'CANCELLED')
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND m.organizer_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "join_requests_delete_requester_pending" ON public.join_requests
  FOR DELETE TO authenticated
  USING (requester_id = (SELECT auth.uid()) AND status = 'PENDING');

-- 7. Gear Marketplace, Evaluations, Notifications & Reports Policies
CREATE POLICY "gear_items_select_authenticated" ON public.gear_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "gear_items_insert_seller" ON public.gear_items
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = seller_id);

CREATE POLICY "gear_items_update_seller" ON public.gear_items
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = seller_id)
  WITH CHECK ((SELECT auth.uid()) = seller_id);

CREATE POLICY "gear_items_delete_seller" ON public.gear_items
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = seller_id);

CREATE POLICY "evaluations_select_authenticated" ON public.evaluations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "evaluations_insert_evaluator" ON public.evaluations
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = evaluator_id
    AND evaluator_id <> target_player_id
  );

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- 8. Storage Buckets & Owner-Scoped Folder RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('gear-images', 'gear-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public_read_kadro_media'
  ) THEN
    CREATE POLICY "public_read_kadro_media" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id IN ('avatars', 'gear-images'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'auth_upload_own_media'
  ) THEN
    CREATE POLICY "auth_upload_own_media" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id IN ('avatars', 'gear-images')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'auth_update_own_media'
  ) THEN
    CREATE POLICY "auth_update_own_media" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id IN ('avatars', 'gear-images')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      )
      WITH CHECK (
        bucket_id IN ('avatars', 'gear-images')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'auth_delete_own_media'
  ) THEN
    CREATE POLICY "auth_delete_own_media" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id IN ('avatars', 'gear-images')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
      );
  END IF;
END $$;

-- 9. Enable Supabase Realtime on Live Collaborative Tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['notifications', 'join_requests', 'roster_slots', 'matches'] LOOP
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
