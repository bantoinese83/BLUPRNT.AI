-- Fix handle_welcome_email to use hardcoded project values.
-- This bypasses Postgres permission issues when setting custom parameters
-- and ensures the welcome email actually works on the hosted instance.

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
  -- Hardcoded values for elucgaegaihkklnfoasm project
  s_url := 'https://elucgaegaihkklnfoasm.supabase.co';
  s_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdWNnYWVnYWloa2tsbmZvYXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg0MTg0NywiZXhwIjoyMDg5NDE3ODQ3fQ.pJvivah-B6G5kS_kYUw8QQtcAKeVhZqiOzEmwhOYJ8c';

  -- Count existing properties for this user
  SELECT count(*) INTO prop_count FROM public.properties WHERE owner_user_id = NEW.owner_user_id;

  -- Only send on the first property
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
