-- Phase 2 Security Hardening: Move SECURITY DEFINER trigger functions out of public API schema

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
ALTER FUNCTION public.validate_evaluation_before_insert() SET SCHEMA private;
ALTER FUNCTION public.recalculate_player_ratings_after_eval() SET SCHEMA private;
ALTER FUNCTION public.notify_on_join_request_insert() SET SCHEMA private;
ALTER FUNCTION public.notify_on_match_update() SET SCHEMA private;
ALTER FUNCTION public.notify_on_gear_update() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.validate_evaluation_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.recalculate_player_ratings_after_eval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_on_join_request_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_on_match_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_on_gear_update() FROM PUBLIC, anon, authenticated;
