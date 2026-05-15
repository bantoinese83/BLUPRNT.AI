-- Refactor user_subscriptions and RPCs to use 'ledger' terminology instead of 'invoice'
BEGIN;
-- 1. Rename columns in user_subscriptions
ALTER TABLE public.user_subscriptions RENAME COLUMN invoice_uploads_count TO ledger_uploads_count;
ALTER TABLE public.user_subscriptions RENAME COLUMN invoice_uploads_reset_at TO ledger_uploads_reset_at;
-- 2. Rename and update RPC functions
-- Note: We drop and recreate because return type and parameter names might change slightly for clarity

DROP FUNCTION IF EXISTS public.reserve_architect_invoice_upload_slot(uuid, int);
CREATE OR REPLACE FUNCTION public.reserve_architect_ledger_upload_slot(
  p_user_id uuid,
  p_max_uploads int
)
RETURNS TABLE(ok boolean, ledger_uploads_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
BEGIN
  -- Lock the row for the specific user
  SELECT s.ledger_uploads_count INTO v_current
  FROM public.user_subscriptions s
  WHERE s.user_id = p_user_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  IF v_current >= p_max_uploads THEN
    RETURN QUERY SELECT false, v_current;
    RETURN;
  END IF;

  -- Increment and return
  UPDATE public.user_subscriptions
  SET 
    ledger_uploads_count = v_current + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING true, public.user_subscriptions.ledger_uploads_count;
END;
$$;
COMMENT ON FUNCTION public.reserve_architect_ledger_upload_slot(uuid, int) IS 'Locks user_subscriptions row and increments ledger_uploads_count when under cap and entitled.';
DROP FUNCTION IF EXISTS public.release_architect_invoice_upload_slot(uuid);
CREATE OR REPLACE FUNCTION public.release_architect_ledger_upload_slot(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET 
    ledger_uploads_count = GREATEST(COALESCE(ledger_uploads_count, 0) - 1, 0),
    updated_at = now()
  WHERE user_id = p_user_id
    AND COALESCE(ledger_uploads_count, 0) > 0;
END;
$$;
COMMENT ON FUNCTION public.release_architect_ledger_upload_slot(uuid) IS 'Decrements ledger_uploads_count for a user, used to undo a reservation if upload fails.';
COMMIT;
