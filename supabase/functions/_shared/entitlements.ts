/**
 * Entitlement checks for invoice upload limits.
 * Free: 3 invoices per project.
 * Architect: 10 invoice uploads per Stripe billing period (aligned with current_period_end).
 * Project Pass: unlimited invoices for that project while pass is valid.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FREE_INVOICE_LIMIT = 3;
const ARCHITECT_UPLOADS_PER_MONTH = 10;

export type EntitlementResult = {
  allowed: boolean;
  reason?: string;
};

export async function checkInvoiceUploadAllowed(
  admin: SupabaseClient,
  userId: string,
  projectId: string,
  documentType: string
): Promise<EntitlementResult> {
  // Only invoices count toward the limit (quotes, warranties, permits are unlimited)
  if (documentType !== "invoice") {
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
      return { allowed: true };
    }
  }

  // 2. Check Architect subscription (quota per Stripe billing period)
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status, current_period_end, invoice_uploads_count")
    .eq("user_id", userId)
    .single();

  if (sub && sub.status === "active") {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    if (periodEnd && periodEnd > now) {
      const count = sub.invoice_uploads_count ?? 0;
      if (count < ARCHITECT_UPLOADS_PER_MONTH) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason:
          "Architect plan: 10 invoice uploads per billing period. Your limit renews when your subscription renews.",
      };
    }
  }

  // 3. Free tier: 3 invoices per project
  const { count } = await admin
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("document_type", "invoice");

  if ((count ?? 0) >= FREE_INVOICE_LIMIT) {
    return {
      allowed: false,
      reason:
        "Free plan: 3 invoices per project. Upgrade for more uploads and premium features.",
    };
  }

  return { allowed: true };
}

export async function incrementArchitectUploadCount(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status, invoice_uploads_count, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!sub || sub.status !== "active") return;

  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  if (!periodEnd || periodEnd <= now) return;

  const count = sub.invoice_uploads_count ?? 0;

  await admin
    .from("user_subscriptions")
    .update({
      invoice_uploads_count: count + 1,
      invoice_uploads_reset_at: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);
}
