-- Policies for these tables already exist (see 20260406194620_mcp_rls_initplan_and_policy_cleanup.sql).
-- Enforce RLS so those policies actually apply.
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
