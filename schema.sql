


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT payload
  FROM public.onboarding_sync
  WHERE token = p_token
    AND expires_at > now()
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("user_email" "text") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_id_by_email"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_child_owner_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT owner_user_id INTO NEW.owner_user_id
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_child_owner_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_document_queue_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'http://supabase_functions_blueprintai-v3:9000/process-document-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'queue_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_document_queue_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_project_owner_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    SELECT owner_user_id INTO NEW.owner_user_id
    FROM public.properties
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_project_owner_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_storage_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'http://supabase_functions_blueprintai-v3:9000/cleanup-storage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'storage_path', OLD.storage_path
    )
  );
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_storage_cleanup"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_welcome_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_welcome_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_document_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.content,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM public.document_embeddings de
  WHERE de.project_id = p_project_id
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_document_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_project_totals"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_min NUMERIC;
  v_max NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(total_cost_min), 0),
    COALESCE(SUM(total_cost_max), 0)
  INTO v_min, v_max
  FROM public.scope_items
  WHERE project_id = p_id;

  UPDATE public.projects
  SET
    estimated_min_total = ROUND(v_min),
    estimated_max_total = ROUND(v_max),
    updated_at = now()
  WHERE id = p_id;
END;
$$;


ALTER FUNCTION "public"."recalc_project_totals"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_architect_invoice_upload_slot"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."release_architect_invoice_upload_slot"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_architect_invoice_upload_slot"("p_user_id" "uuid") IS 'Rolls back one reserved Architect upload slot if the upload pipeline fails after reserve.';



CREATE OR REPLACE FUNCTION "public"."reserve_architect_invoice_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer DEFAULT 10) RETURNS TABLE("ok" boolean, "invoice_uploads_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."reserve_architect_invoice_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reserve_architect_invoice_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) IS 'Locks user_subscriptions row and increments invoice_uploads_count when under cap and entitled. Align with shared/lib/architect-entitlement.ts.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(768) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_processing_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error_message" "text",
    "attempts" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "document_processing_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."document_processing_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "original_filename" "text",
    "uploaded_by_user_id" "uuid" NOT NULL,
    "ocr_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_user_id" "uuid",
    CONSTRAINT "documents_type_check" CHECK (("type" = ANY (ARRAY['invoice'::"text", 'quote'::"text", 'receipt'::"text", 'permit'::"text", 'hoa'::"text", 'warranty'::"text", 'maintenance'::"text", 'manual'::"text", 'insurance'::"text", 'disclosure'::"text", 'inspection'::"text", 'appraisal'::"text", 'energy'::"text", 'contract'::"text", 'lien_waiver'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON CONSTRAINT "documents_type_check" ON "public"."documents" IS 'Enforces valid document types as defined in the shared application logic.';



CREATE TABLE IF NOT EXISTS "public"."invoice_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "quantity" numeric,
    "unit_price" numeric,
    "unit_of_measure" "text" DEFAULT 'ea'::"text" NOT NULL,
    "tax_rate" numeric DEFAULT 0 NOT NULL,
    "tax_amount" numeric DEFAULT 0 NOT NULL,
    "line_total" numeric,
    "category" "text",
    "scope_item_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoice_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "document_id" "uuid",
    "document_type" "text" DEFAULT 'invoice'::"text" NOT NULL,
    "vendor_name" "text",
    "invoice_number" "text",
    "issue_date" "date",
    "due_date" "date",
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "subtotal" numeric,
    "tax_total" numeric,
    "total" numeric DEFAULT 0 NOT NULL,
    "payment_status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_user_id" "uuid",
    "is_verified" boolean DEFAULT true,
    "vendor_contact_info" "jsonb" DEFAULT '{}'::"jsonb",
    "warranty_expiry_date" "date",
    "warranty_notified_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."invoices" REPLICA IDENTITY FULL;


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON COLUMN "public"."invoices"."vendor_contact_info" IS 'Stores extracted contact info (phone, email, website) for "The Home Team" directory.';



COMMENT ON COLUMN "public"."invoices"."warranty_expiry_date" IS 'Optional date when the product or service warranty expires.';



COMMENT ON COLUMN "public"."invoices"."warranty_notified_at" IS 'Timestamp when the user was last notified about this warranty expiration.';



CREATE TABLE IF NOT EXISTS "public"."marketing_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'web'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."marketing_leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "token" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '02:00:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."onboarding_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."physical_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "brand" "text",
    "color_name" "text",
    "color_code" "text",
    "finish" "text",
    "location_in_home" "text",
    "notes" "text",
    "storage_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."physical_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "photo_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text",
    "uploaded_by_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_gallery_photo_type_check" CHECK (("photo_type" = ANY (ARRAY['before'::"text", 'after'::"text", 'progress'::"text"])))
);


ALTER TABLE "public"."project_gallery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_passes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "stripe_checkout_session_id" "text",
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '6 mons'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_passes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_view_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval)
);


ALTER TABLE "public"."project_view_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_view_tokens" IS 'Shareable tokens for contractor/external project view. Use get-project-view edge function to fetch by token.';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "stage" "text",
    "estimated_min_total" numeric,
    "estimated_max_total" numeric,
    "confidence_score" numeric,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_user_id" "uuid",
    "before_photo_storage_path" "text",
    "after_photo_storage_path" "text",
    "grounding_sources" "jsonb" DEFAULT '[]'::"jsonb"
);

ALTER TABLE ONLY "public"."projects" REPLICA IDENTITY FULL;


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."before_photo_storage_path" IS 'Path in project-photos bucket for the initial state image.';



COMMENT ON COLUMN "public"."projects"."after_photo_storage_path" IS 'Path in project-photos bucket for the current/final state image.';



COMMENT ON COLUMN "public"."projects"."grounding_sources" IS 'List of data sources and logic citations (e.g. ZIP-specific labor rates) used by the AI for the initial estimate.';



CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "postal_code" "text" NOT NULL,
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "state" "text" DEFAULT ''::"text" NOT NULL,
    "country" "text" DEFAULT 'US'::"text" NOT NULL,
    "approximate_location" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."revenuecat_webhook_events" (
    "id" "text" NOT NULL,
    "received_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."revenuecat_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scope_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "finish_tier" "text",
    "quantity" numeric,
    "unit" "text",
    "unit_cost_min" numeric,
    "unit_cost_max" numeric,
    "total_cost_min" numeric,
    "total_cost_max" numeric,
    "confidence_score" numeric,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'text'::"text",
    "verification_required" boolean DEFAULT false,
    "confidence_reason" "text",
    "justification" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "phase" "text",
    "maintenance_tips" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_user_id" "uuid"
);

ALTER TABLE ONLY "public"."scope_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."scope_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_packets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "generated_at" timestamp with time zone,
    "storage_path" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seller_packets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "last_active_project_id" "uuid",
    "push_token" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan" "text" DEFAULT 'architect'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "invoice_uploads_count" integer DEFAULT 0 NOT NULL,
    "invoice_uploads_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "revenuecat_entitlement_active" boolean DEFAULT false NOT NULL,
    CONSTRAINT "user_subscriptions_plan_check" CHECK (("plan" = 'architect'::"text")),
    CONSTRAINT "user_subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'trialing'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_subscriptions"."revenuecat_entitlement_active" IS 'True when RevenueCat reports an active mobile store subscription for this user.';



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_embeddings"
    ADD CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_processing_queue"
    ADD CONSTRAINT "document_processing_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_leads"
    ADD CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sync"
    ADD CONSTRAINT "onboarding_sync_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_sync"
    ADD CONSTRAINT "onboarding_sync_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."physical_assets"
    ADD CONSTRAINT "physical_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_gallery"
    ADD CONSTRAINT "project_gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_passes"
    ADD CONSTRAINT "project_passes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_passes"
    ADD CONSTRAINT "project_passes_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_view_tokens"
    ADD CONSTRAINT "project_view_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_view_tokens"
    ADD CONSTRAINT "project_view_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revenuecat_webhook_events"
    ADD CONSTRAINT "revenuecat_webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_packets"
    ADD CONSTRAINT "seller_packets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seller_packets"
    ADD CONSTRAINT "seller_packets_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_key" UNIQUE ("user_id");



CREATE INDEX "document_embeddings_embedding_idx" ON "public"."document_embeddings" USING "hnsw" ("embedding" "public"."vector_cosine_ops");



CREATE INDEX "idx_documents_project_id" ON "public"."documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_uploaded_by_user_id" ON "public"."documents" USING "btree" ("uploaded_by_user_id");



CREATE INDEX "idx_invoice_line_items_invoice_id" ON "public"."invoice_line_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_line_items_scope_item_id" ON "public"."invoice_line_items" USING "btree" ("scope_item_id");



CREATE INDEX "idx_invoices_document_id" ON "public"."invoices" USING "btree" ("document_id");



CREATE INDEX "idx_invoices_project_id" ON "public"."invoices" USING "btree" ("project_id");



CREATE INDEX "idx_invoices_warranty_expiry" ON "public"."invoices" USING "btree" ("warranty_expiry_date") WHERE ("warranty_expiry_date" IS NOT NULL);



CREATE INDEX "idx_marketing_leads_email" ON "public"."marketing_leads" USING "btree" ("email");



CREATE INDEX "idx_onboarding_sync_expires" ON "public"."onboarding_sync" USING "btree" ("expires_at");



CREATE INDEX "idx_onboarding_sync_token" ON "public"."onboarding_sync" USING "btree" ("token");



CREATE INDEX "idx_physical_assets_category" ON "public"."physical_assets" USING "btree" ("category");



CREATE INDEX "idx_physical_assets_project" ON "public"."physical_assets" USING "btree" ("project_id");



CREATE INDEX "idx_project_gallery_project_id" ON "public"."project_gallery" USING "btree" ("project_id");



CREATE INDEX "idx_project_passes_expires" ON "public"."project_passes" USING "btree" ("expires_at");



CREATE INDEX "idx_project_passes_project_id" ON "public"."project_passes" USING "btree" ("project_id");



CREATE INDEX "idx_project_view_tokens_project_id" ON "public"."project_view_tokens" USING "btree" ("project_id");



CREATE INDEX "idx_project_view_tokens_token" ON "public"."project_view_tokens" USING "btree" ("token");



CREATE INDEX "idx_projects_property_id" ON "public"."projects" USING "btree" ("property_id");



CREATE INDEX "idx_properties_owner_postal" ON "public"."properties" USING "btree" ("owner_user_id", "postal_code");



COMMENT ON INDEX "public"."idx_properties_owner_postal" IS 'Primary composite index for property ownership and location lookups. Covers owner_user_id prefix.';



CREATE INDEX "idx_scope_items_project_id" ON "public"."scope_items" USING "btree" ("project_id");



CREATE INDEX "idx_seller_packets_project_id" ON "public"."seller_packets" USING "btree" ("project_id");



CREATE INDEX "idx_seller_packets_property_id" ON "public"."seller_packets" USING "btree" ("property_id");



CREATE INDEX "idx_user_preferences_last_active_project_id" ON "public"."user_preferences" USING "btree" ("last_active_project_id");



CREATE INDEX "idx_user_subscriptions_stripe" ON "public"."user_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_subscriptions_user" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_document_deleted_cleanup_storage" AFTER DELETE ON "public"."documents" FOR EACH ROW WHEN (("old"."storage_path" IS NOT NULL)) EXECUTE FUNCTION "public"."handle_storage_cleanup"();



CREATE OR REPLACE TRIGGER "on_document_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_document_queue_inserted" AFTER INSERT ON "public"."document_processing_queue" FOR EACH ROW EXECUTE FUNCTION "public"."handle_document_queue_insert"();



CREATE OR REPLACE TRIGGER "on_first_property_created_welcome_email" AFTER INSERT ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."handle_welcome_email"();



CREATE OR REPLACE TRIGGER "on_invoice_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_invoice_line_items_updated" BEFORE UPDATE ON "public"."invoice_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_invoices_updated" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_physical_assets_updated" BEFORE UPDATE ON "public"."physical_assets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_project_insert_sync_owner" BEFORE INSERT OR UPDATE OF "property_id", "owner_user_id" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_project_owner_sync"();



CREATE OR REPLACE TRIGGER "on_project_passes_updated" BEFORE UPDATE ON "public"."project_passes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_projects_updated" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_properties_updated" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_scope_item_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_scope_items_updated" BEFORE UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_seller_packets_updated" BEFORE UPDATE ON "public"."seller_packets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_user_preferences_updated" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_user_subscriptions_updated" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."document_embeddings"
    ADD CONSTRAINT "document_embeddings_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_embeddings"
    ADD CONSTRAINT "document_embeddings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_processing_queue"
    ADD CONSTRAINT "document_processing_queue_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_processing_queue"
    ADD CONSTRAINT "document_processing_queue_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_processing_queue"
    ADD CONSTRAINT "document_processing_queue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_line_items"
    ADD CONSTRAINT "invoice_line_items_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."physical_assets"
    ADD CONSTRAINT "physical_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gallery"
    ADD CONSTRAINT "project_gallery_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gallery"
    ADD CONSTRAINT "project_gallery_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_passes"
    ADD CONSTRAINT "project_passes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_view_tokens"
    ADD CONSTRAINT "project_view_tokens_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_packets"
    ADD CONSTRAINT "seller_packets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_packets"
    ADD CONSTRAINT "seller_packets_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_last_active_project_id_fkey" FOREIGN KEY ("last_active_project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read-only access to app_config" ON "public"."app_config" FOR SELECT USING (true);



CREATE POLICY "Anyone can create a sync record" ON "public"."onboarding_sync" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("char_length"("token") >= 32) AND ("jsonb_typeof"("payload") = 'object'::"text") AND ("payload" <> '{}'::"jsonb")));



COMMENT ON POLICY "Anyone can create a sync record" ON "public"."onboarding_sync" IS 'Allows anonymous creation of onboarding sync records if the token and payload meet minimum structural requirements.';



CREATE POLICY "Owners can delete own tokens" ON "public"."project_view_tokens" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_view_tokens"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can insert seller packets" ON "public"."seller_packets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "seller_packets"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can insert tokens" ON "public"."project_view_tokens" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_view_tokens"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can manage physical assets" ON "public"."physical_assets" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "physical_assets"."project_id") AND ("pr"."owner_user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "physical_assets"."project_id") AND ("pr"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Owners can read project passes" ON "public"."project_passes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_passes"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can select own tokens" ON "public"."project_view_tokens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_view_tokens"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can select seller packets" ON "public"."seller_packets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "seller_packets"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners can update seller packets" ON "public"."seller_packets" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "seller_packets"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Service role can manage RC events" ON "public"."revenuecat_webhook_events" TO "authenticated" USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can select leads" ON "public"."marketing_leads" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can manage their own properties" ON "public"."properties" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their project gallery" ON "public"."project_gallery" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_gallery"."project_id") AND ("pr"."owner_user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "project_gallery"."project_id") AND ("pr"."owner_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own subscription" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_processing_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_access_policy" ON "public"."documents" TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."projects"
     JOIN "public"."properties" ON (("projects"."property_id" = "properties"."id")))
  WHERE (("projects"."id" = "documents"."project_id") AND ("properties"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "embeddings_access_policy" ON "public"."document_embeddings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "document_embeddings"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."invoice_line_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoice_lines_via_invoice" ON "public"."invoice_line_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."invoices" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."invoices" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("i"."id" = "invoice_line_items"."invoice_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invoices_access_policy" ON "public"."invoices" TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."projects"
     JOIN "public"."properties" ON (("projects"."property_id" = "properties"."id")))
  WHERE (("projects"."id" = "invoices"."project_id") AND ("properties"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."marketing_leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_sync" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."physical_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_passes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_view_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_access_policy" ON "public"."projects" TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."properties"
  WHERE (("properties"."id" = "projects"."property_id") AND ("properties"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "queue_access_policy" ON "public"."document_processing_queue" FOR SELECT TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("p"."id" = "document_processing_queue"."project_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."revenuecat_webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scope_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scope_items_access_policy" ON "public"."scope_items" TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."projects"
     JOIN "public"."properties" ON (("projects"."property_id" = "properties"."id")))
  WHERE (("projects"."id" = "scope_items"."project_id") AND ("properties"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."seller_packets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_self" ON "public"."user_preferences" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_id_by_email"("user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_child_owner_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_child_owner_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_child_owner_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_document_queue_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_document_queue_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_document_queue_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_project_owner_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_project_owner_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_project_owner_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_storage_cleanup"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_storage_cleanup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_storage_cleanup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_welcome_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_welcome_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_welcome_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_architect_invoice_upload_slot"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_architect_invoice_upload_slot"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reserve_architect_invoice_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_architect_invoice_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."document_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."document_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."document_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."document_processing_queue" TO "anon";
GRANT ALL ON TABLE "public"."document_processing_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."document_processing_queue" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_line_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_line_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."marketing_leads" TO "anon";
GRANT ALL ON TABLE "public"."marketing_leads" TO "authenticated";
GRANT ALL ON TABLE "public"."marketing_leads" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_sync" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_sync" TO "service_role";



GRANT ALL ON TABLE "public"."physical_assets" TO "anon";
GRANT ALL ON TABLE "public"."physical_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."physical_assets" TO "service_role";



GRANT ALL ON TABLE "public"."project_gallery" TO "anon";
GRANT ALL ON TABLE "public"."project_gallery" TO "authenticated";
GRANT ALL ON TABLE "public"."project_gallery" TO "service_role";



GRANT ALL ON TABLE "public"."project_passes" TO "anon";
GRANT ALL ON TABLE "public"."project_passes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_passes" TO "service_role";



GRANT ALL ON TABLE "public"."project_view_tokens" TO "anon";
GRANT ALL ON TABLE "public"."project_view_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."project_view_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."revenuecat_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."revenuecat_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."revenuecat_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."scope_items" TO "anon";
GRANT ALL ON TABLE "public"."scope_items" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_items" TO "service_role";



GRANT ALL ON TABLE "public"."seller_packets" TO "anon";
GRANT ALL ON TABLE "public"."seller_packets" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_packets" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







