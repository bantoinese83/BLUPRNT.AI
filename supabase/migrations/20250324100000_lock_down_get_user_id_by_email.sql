-- get_user_id_by_email reads auth.users (SECURITY DEFINER). Only the service role
-- should invoke it (e.g. stripe-webhook via service client). Never expose to anon/authenticated.

REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
