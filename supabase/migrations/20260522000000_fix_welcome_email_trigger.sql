-- handle_welcome_email: use DB session settings (or legacy GUC names) for URL and
-- service role key — do not hardcode credentials in migrations.

CREATE OR REPLACE FUNCTION public.handle_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  prop_count int;
  s_url text;
  s_key text;
BEGIN
  SELECT count(*) INTO prop_count
  FROM public.properties
  WHERE owner_user_id = NEW.owner_user_id;

  IF prop_count = 1 THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.owner_user_id;

    s_url := current_setting('app.supabase_url', true);
    s_key := current_setting('app.supabase_service_role_key', true);
    IF s_url IS NULL THEN s_url := current_setting('supabase_url', true); END IF;
    IF s_key IS NULL THEN s_key := current_setting('supabase_service_role_key', true); END IF;

    IF user_email IS NOT NULL AND s_url IS NOT NULL AND s_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := s_url || '/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || s_key
        ),
        body := jsonb_build_object(
          'to', user_email,
          'template', 'welcome',
          'params', jsonb_build_object('userName', user_email)
        )
      );
    ELSE
      RAISE WARNING 'Skipping welcome email: missing user_email, supabase_url, or service_role_key';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_welcome_email() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_welcome_email() FROM anon, authenticated;
