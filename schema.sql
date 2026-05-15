


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



CREATE OR REPLACE FUNCTION "public"."cleanup_stale_onboarding_sync"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.onboarding_sync
  WHERE created_at < now() - interval '24 hours';
END;
$$;


ALTER FUNCTION "public"."cleanup_stale_onboarding_sync"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_system_config"("config_key" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF config_key = 'edge_functions_base_url' THEN
    RETURN 'https://elucgaegaihkklnfoasm.supabase.co/functions/v1';
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_system_config"("config_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_id_by_email"("user_email" "text") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_id_by_email"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_child_owner_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/process-document-queue',
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


CREATE OR REPLACE FUNCTION "public"."handle_document_type_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.type IS NULL OR NEW.type = '' THEN
    NEW.type := 'other';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_document_type_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_processing_failure_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Update ledger entry to clear "Processing..."
    UPDATE public.ledger_entries
    SET 
      vendor_name = CASE 
        WHEN vendor_name = 'Processing...' THEN 'Extraction Failed' 
        ELSE vendor_name 
      END,
      is_verified = false,
      updated_at = now()
    WHERE document_id = NEW.document_id;

    -- Update document ocr_status to 'failed'
    UPDATE public.documents
    SET ocr_status = 'failed'
    WHERE id = NEW.document_id;
  END IF;

  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Ensure document ocr_status is 'success'
    UPDATE public.documents
    SET ocr_status = 'success'
    WHERE id = NEW.document_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_processing_failure_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_project_owner_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM net.http_post(
    url := public.get_system_config('edge_functions_base_url') || '/cleanup-storage',
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
  -- Only send on the VERY FIRST property created by this user
  SELECT count(*) INTO prop_count FROM public.properties WHERE owner_user_id = NEW.owner_user_id;
  
  IF prop_count = 1 THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.owner_user_id;
    
    -- Use true as second arg to current_setting to return NULL instead of throwing if missing
    s_url := current_setting('app.supabase_url', true);
    s_key := current_setting('app.supabase_service_role_key', true);
    
    -- Also check the non-prefixed ones just in case
    IF s_url IS NULL THEN s_url := current_setting('supabase_url', true); END IF;
    IF s_key IS NULL THEN s_key := current_setting('supabase_service_role_key', true); END IF;
    
    IF user_email IS NOT NULL AND s_url IS NOT NULL AND s_key IS NOT NULL THEN
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
    ELSE
      -- Log that we couldn't send the email but don't block the transaction
      RAISE WARNING 'Skipping welcome email: missing user_email, supabase_url, or service_role_key';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_welcome_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_document_embeddings"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."match_document_embeddings"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."release_architect_ledger_upload_slot"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."release_architect_ledger_upload_slot"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."release_architect_ledger_upload_slot"("p_user_id" "uuid") IS 'Decrements ledger_uploads_count for a user, used to undo a reservation if upload fails.';



CREATE OR REPLACE FUNCTION "public"."reserve_architect_ledger_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) RETURNS TABLE("ok" boolean, "ledger_uploads_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."reserve_architect_ledger_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reserve_architect_ledger_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) IS 'Locks user_subscriptions row and increments ledger_uploads_count when under cap and entitled.';


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
    "embedding" "extensions"."vector"(768) NOT NULL,
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
    "original_filename" "text" NOT NULL,
    "uploaded_by_user_id" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ocr_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "owner_user_id" "uuid",
    CONSTRAINT "documents_ocr_status_check" CHECK (("ocr_status" = ANY (ARRAY['pending'::"text", 'success'::"text", 'failed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "documents_type_check" CHECK (("type" = ANY (ARRAY['invoice'::"text", 'quote'::"text", 'receipt'::"text", 'permit'::"text", 'hoa'::"text", 'warranty'::"text", 'maintenance'::"text", 'manual'::"text", 'insurance'::"text", 'disclosure'::"text", 'inspection'::"text", 'appraisal'::"text", 'energy'::"text", 'contract'::"text", 'lien_waiver'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON CONSTRAINT "documents_type_check" ON "public"."documents" IS 'Enforces valid document types as defined in the shared application logic.';



CREATE TABLE IF NOT EXISTS "public"."ledger_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "vendor_name" "text",
    "vendor_address" "text",
    "vendor_phone" "text",
    "vendor_email" "text",
    "invoice_number" "text",
    "issue_date" "date",
    "due_date" "date",
    "currency" "text",
    "subtotal" numeric,
    "tax_total" numeric,
    "total" numeric,
    "payment_status" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "payment_method" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "document_type" "text" DEFAULT 'invoice'::"text",
    "category" "text",
    "vendor_contact_info" "jsonb" DEFAULT '{}'::"jsonb",
    "warranty_expiry_date" "date",
    "warranty_notified_at" timestamp with time zone,
    "owner_user_id" "uuid",
    "is_verified" boolean DEFAULT true,
    "ai_summary" "text",
    "insurance_renewal_date" "date",
    "permit_expiration_date" "date",
    CONSTRAINT "invoices_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['unpaid'::"text", 'partial'::"text", 'paid'::"text", 'unknown'::"text"])))
);

ALTER TABLE ONLY "public"."ledger_entries" REPLICA IDENTITY FULL;


ALTER TABLE "public"."ledger_entries" OWNER TO "postgres";


COMMENT ON TABLE "public"."ledger_entries" IS 'The smart ledger for all project documents (Invoices, Receipts, Permits, HOA, etc).';



COMMENT ON COLUMN "public"."ledger_entries"."vendor_contact_info" IS 'Stores extracted contact info (phone, email, website) for "The Home Team" directory.';



COMMENT ON COLUMN "public"."ledger_entries"."warranty_expiry_date" IS 'Optional date when the product or service warranty expires.';



COMMENT ON COLUMN "public"."ledger_entries"."warranty_notified_at" IS 'Timestamp when the user was last notified about this warranty expiration.';



COMMENT ON COLUMN "public"."ledger_entries"."ai_summary" IS 'AI-generated concise summary of the document contents.';



COMMENT ON COLUMN "public"."ledger_entries"."insurance_renewal_date" IS 'Optional policy renewal or term-end date for insurance documents.';



COMMENT ON COLUMN "public"."ledger_entries"."permit_expiration_date" IS 'Optional permit expiration, final approval, or CO date when shown on the permit.';



CREATE TABLE IF NOT EXISTS "public"."ledger_line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ledger_entry_id" "uuid" NOT NULL,
    "description" "text",
    "product_code" "text",
    "quantity" numeric,
    "unit_price" numeric,
    "unit_of_measure" "text",
    "tax_rate" numeric,
    "tax_amount" numeric,
    "discount_rate" numeric,
    "discount_amount" numeric,
    "line_total" numeric,
    "category" "text",
    "scope_item_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invoice_line_items_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['labor'::"text", 'material'::"text", 'permit'::"text", 'design'::"text", 'other'::"text"]))))
);


ALTER TABLE "public"."ledger_line_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."ledger_line_items" IS 'Individual line items extracted from ledger documents.';



COMMENT ON COLUMN "public"."ledger_line_items"."ledger_entry_id" IS 'Reference to the parent record in ledger_entries.';



CREATE TABLE IF NOT EXISTS "public"."marketing_leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text" DEFAULT 'exit_intent_modal'::"text",
    "captured_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "owner_user_id" "uuid"
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
    "owner_user_id" "uuid",
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


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "stage" "text" NOT NULL,
    "estimated_min_total" numeric,
    "estimated_max_total" numeric,
    "confidence_score" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "before_photo_storage_path" "text",
    "after_photo_storage_path" "text",
    "grounding_sources" "jsonb" DEFAULT '[]'::"jsonb",
    "owner_user_id" "uuid",
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "stripe_session_id" "text",
    CONSTRAINT "projects_stage_check" CHECK (("stage" = ANY (ARRAY['planning'::"text", 'collecting_quotes'::"text", 'in_progress'::"text", 'completed'::"text"]))),
    CONSTRAINT "projects_type_check" CHECK (("type" = ANY (ARRAY['kitchen'::"text", 'bath'::"text", 'paint'::"text", 'roof'::"text", 'flooring'::"text", 'other'::"text"])))
);

ALTER TABLE ONLY "public"."projects" REPLICA IDENTITY FULL;


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."metadata" IS 'Stores AI-generated project strategy, value engineering tips, and regional context.';



COMMENT ON COLUMN "public"."projects"."before_photo_storage_path" IS 'Path in project-photos bucket for the initial state image.';



COMMENT ON COLUMN "public"."projects"."after_photo_storage_path" IS 'Path in project-photos bucket for the current/final state image.';



COMMENT ON COLUMN "public"."projects"."grounding_sources" IS 'List of data sources and logic citations (e.g. ZIP-specific labor rates) used by the AI for the initial estimate.';



COMMENT ON COLUMN "public"."projects"."payment_status" IS 'Tracks the payment status of the project (unpaid, paid, refunded)';



CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "address_line1" "text",
    "city" "text" DEFAULT ''::"text" NOT NULL,
    "state" "text" DEFAULT ''::"text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "country" "text" DEFAULT 'US'::"text" NOT NULL,
    "approximate_location" "text",
    "year_built" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scope_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "finish_tier" "text",
    "quantity" numeric,
    "unit" "text",
    "unit_cost_min" numeric,
    "unit_cost_max" numeric,
    "total_cost_min" numeric,
    "total_cost_max" numeric,
    "confidence_score" numeric,
    "source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "verification_required" boolean DEFAULT false,
    "confidence_reason" "text",
    "justification" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "phase" "text",
    "maintenance_tips" "text",
    "owner_user_id" "uuid",
    CONSTRAINT "scope_items_finish_tier_check" CHECK ((("finish_tier" IS NULL) OR ("finish_tier" = ANY (ARRAY['economy'::"text", 'mid'::"text", 'premium'::"text"])))),
    CONSTRAINT "scope_items_source_check" CHECK (("source" = ANY (ARRAY['photo'::"text", 'text'::"text", 'manual'::"text"])))
);

ALTER TABLE ONLY "public"."scope_items" REPLICA IDENTITY FULL;


ALTER TABLE "public"."scope_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."scope_items"."metadata" IS 'Stores AI-generated justification, priority, phase, and maintenance tips.';



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
    "ledger_uploads_count" integer DEFAULT 0 NOT NULL,
    "ledger_uploads_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", "now"()),
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



ALTER TABLE ONLY "public"."ledger_line_items"
    ADD CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ledger_entries"
    ADD CONSTRAINT "invoices_document_id_key" UNIQUE ("document_id");



ALTER TABLE ONLY "public"."ledger_entries"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketing_leads"
    ADD CONSTRAINT "marketing_leads_email_key" UNIQUE ("email");



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



CREATE INDEX "document_embeddings_embedding_idx" ON "public"."document_embeddings" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE UNIQUE INDEX "documents_invoice_one_per_doc" ON "public"."documents" USING "btree" ("id") WHERE ("type" = 'invoice'::"text");



CREATE INDEX "idx_documents_project_id" ON "public"."documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_uploaded_by_user_id" ON "public"."documents" USING "btree" ("uploaded_by_user_id");



CREATE INDEX "idx_invoice_line_items_invoice_id" ON "public"."ledger_line_items" USING "btree" ("ledger_entry_id");



CREATE INDEX "idx_invoice_line_items_scope_item_id" ON "public"."ledger_line_items" USING "btree" ("scope_item_id");



CREATE INDEX "idx_invoices_document_id" ON "public"."ledger_entries" USING "btree" ("document_id");



CREATE INDEX "idx_invoices_project_id" ON "public"."ledger_entries" USING "btree" ("project_id");



CREATE INDEX "idx_invoices_warranty_expiry" ON "public"."ledger_entries" USING "btree" ("warranty_expiry_date") WHERE ("warranty_expiry_date" IS NOT NULL);



CREATE INDEX "idx_ledger_insurance_renewal" ON "public"."ledger_entries" USING "btree" ("insurance_renewal_date") WHERE ("insurance_renewal_date" IS NOT NULL);



CREATE INDEX "idx_ledger_permit_expiration" ON "public"."ledger_entries" USING "btree" ("permit_expiration_date") WHERE ("permit_expiration_date" IS NOT NULL);



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



CREATE OR REPLACE TRIGGER "on_invoice_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."ledger_entries" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_invoice_line_items_updated" BEFORE UPDATE ON "public"."ledger_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_invoices_updated" BEFORE UPDATE ON "public"."ledger_entries" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_physical_assets_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."physical_assets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_physical_assets_updated" BEFORE UPDATE ON "public"."physical_assets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_project_gallery_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."project_gallery" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_project_insert_sync_owner" BEFORE INSERT OR UPDATE OF "property_id", "owner_user_id" ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_project_owner_sync"();



CREATE OR REPLACE TRIGGER "on_project_passes_updated" BEFORE UPDATE ON "public"."project_passes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_projects_updated" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_properties_updated" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_scope_item_insert_sync_owner" BEFORE INSERT OR UPDATE OF "project_id", "owner_user_id" ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_child_owner_sync"();



CREATE OR REPLACE TRIGGER "on_scope_items_updated" BEFORE UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_seller_packets_updated" BEFORE UPDATE ON "public"."seller_packets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_user_preferences_updated" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_user_subscriptions_updated" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "tr_document_type_default" BEFORE INSERT ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."handle_document_type_default"();



CREATE OR REPLACE TRIGGER "tr_processing_failure_sync" AFTER UPDATE ON "public"."document_processing_queue" FOR EACH ROW EXECUTE FUNCTION "public"."handle_processing_failure_sync"();



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



ALTER TABLE ONLY "public"."ledger_line_items"
    ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ledger_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger_line_items"
    ADD CONSTRAINT "invoice_line_items_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ledger_entries"
    ADD CONSTRAINT "invoices_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ledger_entries"
    ADD CONSTRAINT "invoices_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ledger_entries"
    ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."physical_assets"
    ADD CONSTRAINT "physical_assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."physical_assets"
    ADD CONSTRAINT "physical_assets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_gallery"
    ADD CONSTRAINT "project_gallery_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



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



CREATE POLICY "Owners can manage physical assets" ON "public"."physical_assets" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



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



CREATE POLICY "Service role can select leads" ON "public"."marketing_leads" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."jwt"() AS "jwt") ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can manage their own properties" ON "public"."properties" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can manage their project gallery" ON "public"."project_gallery" TO "authenticated" USING (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")));



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



CREATE POLICY "invoice_lines_via_invoice" ON "public"."ledger_line_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."ledger_entries" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("i"."id" = "ledger_line_items"."ledger_entry_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."ledger_entries" "i"
     JOIN "public"."projects" "p" ON (("p"."id" = "i"."project_id")))
     JOIN "public"."properties" "pr" ON (("p"."property_id" = "pr"."id")))
  WHERE (("i"."id" = "ledger_line_items"."ledger_entry_id") AND ("pr"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "invoices_access_policy" ON "public"."ledger_entries" TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."projects"
     JOIN "public"."properties" ON (("projects"."property_id" = "properties"."id")))
  WHERE (("projects"."id" = "ledger_entries"."project_id") AND ("properties"."owner_user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."ledger_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ledger_line_items" ENABLE ROW LEVEL SECURITY;


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



REVOKE ALL ON FUNCTION "public"."cleanup_stale_onboarding_sync"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_stale_onboarding_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_onboarding_sync_payload"("p_token" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_system_config"("config_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_system_config"("config_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_id_by_email"("user_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_id_by_email"("user_email" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_child_owner_sync"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_child_owner_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_document_queue_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_document_queue_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_document_type_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_document_type_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_document_type_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_processing_failure_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_processing_failure_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_processing_failure_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_project_owner_sync"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_project_owner_sync"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_storage_cleanup"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_storage_cleanup"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_welcome_email"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_welcome_email"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."match_document_embeddings"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_project_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_project_totals"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."release_architect_ledger_upload_slot"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."release_architect_ledger_upload_slot"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reserve_architect_ledger_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reserve_architect_ledger_upload_slot"("p_user_id" "uuid", "p_max_uploads" integer) TO "service_role";



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



GRANT ALL ON TABLE "public"."ledger_entries" TO "anon";
GRANT ALL ON TABLE "public"."ledger_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger_entries" TO "service_role";



GRANT ALL ON TABLE "public"."ledger_line_items" TO "anon";
GRANT ALL ON TABLE "public"."ledger_line_items" TO "authenticated";
GRANT ALL ON TABLE "public"."ledger_line_items" TO "service_role";



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







