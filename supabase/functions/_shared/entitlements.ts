/**
 * Entitlement checks for ledger record upload limits.
 * Free: 3 bill/receipt records per project.
 * Architect: 10 global bill/receipt uploads per billing period (Stripe period when applicable, or store entitlement).
 * Project Pass: unlimited records for that project while pass is valid.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { isArchitectQuotaLedgerEntryType } from "../../../shared/lib/infer-document-type.ts";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "../../../shared/lib/ledger-entry-quota.ts";
import {
  isArchitectGlobalUploadQuotaAvailable,
  isArchitectPlanEffective,
} from "./architect-entitlement.ts";

const FREE_RECORD_LIMIT = FREE_TIER_BILL_RECEIPT_LIMIT;
export const ARCHITECT_UPLOADS_PER_MONTH = 10;

export type EntitlementResult = {
  allowed: boolean;
  reason?: string;
  /** Stable code for clients (see shared/constants/upload-error-codes.ts). */
  code?: "LEDGER_LIMIT_FREE_PROJECT" | "LEDGER_LIMIT_ARCHITECT_MONTH";
};

export async function checkLedgerUploadAllowed(
  admin: SupabaseClient,
  userId: string,
  projectId: string,
  documentType: string,
): Promise<EntitlementResult> {
  // Invoices and receipts count toward the project / Architect upload limits; other record types do not
  if (!isArchitectQuotaLedgerEntryType(documentType)) {
    return { allowed: true };
  }

  const now = new Date();

  // 1. Check Project Pass (unlimited for this project)
  const { data: pass } = await admin
    .from("project_passes")
    .select("expires_at")
    .eq("project_id", projectId)
    .single();

  if (pass) {
    const expiresAt = pass.expires_at ? new Date(pass.expires_at) : null;
    if (expiresAt && expiresAt > now) {
      return { allowed: true, reason: "project_pass" };
    }
  }

  // 2. Fetch Architect subscription and project-specific record count in parallel
  const [subRes, recCountRes] = await Promise.all([
    admin
      .from("user_subscriptions")
      .select(
        "status, current_period_end, ledger_uploads_count, revenuecat_entitlement_active",
      )
      .eq("user_id", userId)
      .single(),
    admin
      .from("ledger_entries")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("document_type", ["invoice", "receipt"]),
  ]);

  const sub = subRes.data;
  const projectRecordCount = recCountRes.count ?? 0;

  const architectHasGlobalSpace = isArchitectGlobalUploadQuotaAvailable(
    sub,
    now,
    ARCHITECT_UPLOADS_PER_MONTH,
  );
  const projectHasFreeSpace = projectRecordCount < FREE_RECORD_LIMIT;

  // 3. Evaluate permissions
  // Architects get their global 10-upload quota OR the standard free 3-per-project floor.
  if (architectHasGlobalSpace) {
    return { allowed: true, reason: "architect_plan" };
  }

  if (projectHasFreeSpace) {
    return { allowed: true, reason: "free_limit" };
  }

  // 4. Blocked - return descriptive reason
  if (
    isArchitectPlanEffective(sub, now) &&
    (sub?.ledger_uploads_count ?? 0) >= ARCHITECT_UPLOADS_PER_MONTH
  ) {
    return {
      allowed: false,
      reason:
        `Architect plan limit reached (${ARCHITECT_UPLOADS_PER_MONTH} global uploads). Renewals occur when your monthly subscription cycles.`,
      code: "LEDGER_LIMIT_ARCHITECT_MONTH",
    };
  }

  return {
    allowed: false,
    reason:
      `Free tier limit reached (${FREE_RECORD_LIMIT} bill or receipt uploads for this project). Upgrade for more uploads and premium features.`,
    code: "LEDGER_LIMIT_FREE_PROJECT",
  };
}

/** Row-locked atomic reserve; call before storage/OCR. See DB reserve_architect_ledger_upload_slot. */
export async function reserveArchitectLedgerUploadSlot(
  admin: SupabaseClient,
  userId: string,
): Promise<{ ok: boolean; ledger_uploads_count?: number }> {
  const { data, error } = await admin.rpc(
    "reserve_architect_ledger_upload_slot",
    {
      p_user_id: userId,
      p_max_uploads: ARCHITECT_UPLOADS_PER_MONTH,
    },
  );
  if (error) {
    console.error(
      "[entitlements] reserve_architect_ledger_upload_slot:",
      error,
    );
    return { ok: false };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return { ok: false };
  const rec = row as { ok?: boolean; ledger_uploads_count?: number };
  return {
    ok: Boolean(rec.ok),
    ledger_uploads_count: rec.ledger_uploads_count,
  };
}

/** Undo reserve when upload fails after slot was claimed. */
export async function releaseArchitectLedgerUploadSlot(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await admin.rpc("release_architect_ledger_upload_slot", {
    p_user_id: userId,
  });
  if (error) {
    console.error(
      "[entitlements] release_architect_ledger_upload_slot:",
      error,
    );
  }
}
