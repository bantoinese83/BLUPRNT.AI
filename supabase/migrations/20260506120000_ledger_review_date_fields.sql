-- Optional type-specific dates on ledger entries (review modal + reminders).
ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS insurance_renewal_date date,
  ADD COLUMN IF NOT EXISTS permit_expiration_date date;

COMMENT ON COLUMN public.ledger_entries.insurance_renewal_date IS 'Optional policy renewal or term-end date for insurance documents.';
COMMENT ON COLUMN public.ledger_entries.permit_expiration_date IS 'Optional permit expiration, final approval, or CO date when shown on the permit.';

CREATE INDEX IF NOT EXISTS idx_ledger_insurance_renewal
  ON public.ledger_entries (insurance_renewal_date)
  WHERE insurance_renewal_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ledger_permit_expiration
  ON public.ledger_entries (permit_expiration_date)
  WHERE permit_expiration_date IS NOT NULL;
