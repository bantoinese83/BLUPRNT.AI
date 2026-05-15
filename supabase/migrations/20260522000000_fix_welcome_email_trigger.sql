-- Fix handle_welcome_email to not crash if supabase_url or service_role_key are missing.
-- This prevents the "unrecognized configuration parameter" error from blocking inserts.

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
  -- 1. Try to get settings safely
  s_url := current_setting('supabase_url', true);
  s_key := current_setting('supabase_service_role_key', true);

  -- 2. If settings are missing, log a warning and exit early instead of crashing
  IF s_url IS NULL OR s_key IS NULL THEN
    -- We use WARNING so it doesn't fail the transaction but shows up in logs
    RAISE WARNING 'Welcome email skipped: supabase_url or supabase_service_role_key not set in database configuration.';
    RETURN NEW;
  END IF;

  -- 3. Count existing properties for this user
  SELECT count(*) INTO prop_count FROM public.properties WHERE owner_user_id = NEW.owner_user_id;

  -- 4. Only send on the first property
  IF prop_count = 1 THEN
    -- Fetch email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.owner_user_id;

    IF user_email IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := s_url || '/functions/v1/send-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || s_key
          ),
          body := jsonb_build_object(
            'to', user_email,
            'template', 'welcome',
            'params', jsonb_build_object(
              'userName', user_email
            )
          )
        );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
