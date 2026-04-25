-- Trigger to send a welcome email when a new property (and thus a new onboarding user) is created.
-- Utilizes the send-email edge function.

-- 1. Function to call the edge function
CREATE OR REPLACE FUNCTION public.handle_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  prop_count int;
BEGIN
  -- Count existing properties for this user
  SELECT count(*) INTO prop_count FROM public.properties WHERE owner_user_id = NEW.owner_user_id;

  -- Only send on the first property (which will be 1 at this point since it's an AFTER INSERT trigger)
  IF prop_count = 1 THEN
    -- Fetch email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.owner_user_id;

    IF user_email IS NOT NULL THEN
      PERFORM
        net.http_post(
          url := current_setting('supabase_url') || '/functions/v1/send-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase_service_role_key')
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

-- 2. Trigger on public.properties
CREATE OR REPLACE TRIGGER on_first_property_created_welcome_email
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_welcome_email();
