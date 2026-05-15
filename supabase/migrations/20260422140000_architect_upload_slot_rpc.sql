-- Serialized Architect global invoice upload counter: reserve before upload work, release on failure.
-- Eligibility mirrors shared/lib/architect-entitlement.ts (isArchitectGlobalUploadQuotaAvailable).

CREATE OR REPLACE FUNCTION public.reserve_architect_invoice_upload_slot(
  p_user_id uuid,
  p_max_uploads int DEFAULT 10
)
RETURNS TABLE(ok boolean, invoice_uploads_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_count int;
  v_status text;
  v_period_end timestamptz;
  v_rc boolean;
  v_stripe_ok boolean;
  v_eligible boolean;
BEGIN
  IF p_max_uploads IS NULL OR p_max_uploads < 1 THEN
    p_max_uploads := 10;
  END IF;

  SELECT
    s.invoice_uploads_count,
    s.status,
    s.current_period_end,
    s.revenuecat_entitlement_active
  INTO v_count, v_status, v_period_end, v_rc
  FROM public.user_subscriptions s
  WHERE s.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  v_stripe_ok := (
    v_status IN ('active', 'trialing')
    AND (v_period_end IS NULL OR v_period_end > v_now)
  );

  v_eligible := COALESCE(v_count, 0) < p_max_uploads
    AND (v_stripe_ok OR COALESCE(v_rc, false));

  IF NOT v_eligible THEN
    RETURN QUERY SELECT false, v_count;
    RETURN;
  END IF;

  UPDATE public.user_subscriptions u
  SET
    invoice_uploads_count = COALESCE(u.invoice_uploads_count, 0) + 1,
    invoice_uploads_reset_at = CASE
      WHEN u.current_period_end IS NOT NULL AND u.current_period_end > v_now
      THEN u.current_period_end
      ELSE v_now
    END,
    updated_at = v_now
  WHERE u.user_id = p_user_id;

  RETURN QUERY SELECT true, COALESCE(v_count, 0) + 1;
END;
$$;
COMMENT ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) IS
  'Locks user_subscriptions row and increments invoice_uploads_count when under cap and entitled. Align with shared/lib/architect-entitlement.ts.';
CREATE OR REPLACE FUNCTION public.release_architect_invoice_upload_slot(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET
    invoice_uploads_count = GREATEST(COALESCE(invoice_uploads_count, 0) - 1, 0),
    updated_at = now()
  WHERE user_id = p_user_id
    AND COALESCE(invoice_uploads_count, 0) > 0;
END;
$$;
COMMENT ON FUNCTION public.release_architect_invoice_upload_slot(uuid) IS
  'Rolls back one reserved Architect upload slot if the upload pipeline fails after reserve.';
REVOKE ALL ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM anon;
REVOKE ALL ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_architect_invoice_upload_slot(uuid, int) TO service_role;
REVOKE ALL ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.release_architect_invoice_upload_slot(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.release_architect_invoice_upload_slot(uuid) TO service_role;
