/**
 * Entitlement checks for invoice upload limits.
 * Free: 3 invoices per project.
 * Architect: 10 invoice uploads per month.
 * Project Pass: unlimited for that project for 6 months.
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

  // 2. Check Architect subscription (10/month)
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status, current_period_end, invoice_uploads_count, invoice_uploads_reset_at")
    .eq("user_id", userId)
    .single();

  if (sub && sub.status === "active") {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
    if (periodEnd && periodEnd > now) {
      const resetAt = sub.invoice_uploads_reset_at ? new Date(sub.invoice_uploads_reset_at) : null;
      let count = sub.invoice_uploads_count ?? 0;
      if (resetAt && resetAt <= now) {
        count = 0;
      }
      if (count < ARCHITECT_UPLOADS_PER_MONTH) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "Architect plan: 10 invoice uploads per month. Upgrade or wait for next month.",
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
      reason: "Free limit: 3 invoices per project. Upgrade for unlimited.",
    };
  }

  return { allowed: true };
}

export async function incrementArchitectUploadCount(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status, invoice_uploads_count, invoice_uploads_reset_at")
    .eq("user_id", userId)
    .single();

  if (!sub || sub.status !== "active") return;

  const now = new Date();
  const resetAt = sub.invoice_uploads_reset_at ? new Date(sub.invoice_uploads_reset_at) : null;
  let count = sub.invoice_uploads_count ?? 0;
  let newResetAt = resetAt;

  if (!resetAt || resetAt <= now) {
    count = 0;
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    newResetAt = nextMonth.toISOString();
  }

  await admin
    .from("user_subscriptions")
    .update({
      invoice_uploads_count: count + 1,
      invoice_uploads_reset_at: newResetAt,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);
}
