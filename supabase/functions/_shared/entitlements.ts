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
  documentType: string,
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
      return { allowed: true, reason: "project_pass" };
    }
  }

  // 2. Fetch Architect subscription and project-specific invoice count in parallel
  const [subRes, invCountRes] = await Promise.all([
    admin
      .from("user_subscriptions")
      .select("status, current_period_end, invoice_uploads_count")
      .eq("user_id", userId)
      .single(),
    admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("document_type", "invoice"),
  ]);

  const sub = subRes.data;
  const projectInvoiceCount = invCountRes.count ?? 0;

  const isArchitectActive = sub && sub.status === "active";
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  const isPeriodValid = periodEnd && periodEnd > now;

  const architectHasGlobalSpace =
    isArchitectActive &&
    isPeriodValid &&
    (sub.invoice_uploads_count ?? 0) < ARCHITECT_UPLOADS_PER_MONTH;
  const projectHasFreeSpace = projectInvoiceCount < FREE_INVOICE_LIMIT;

  // 3. Evaluate permissions
  // Architects get their global 10-upload quota OR the standard free 3-per-project floor.
  if (architectHasGlobalSpace) {
    return { allowed: true, reason: "architect_plan" };
  }

  if (projectHasFreeSpace) {
    return { allowed: true, reason: "free_limit" };
  }

  // 4. Blocked - return descriptive reason
  if (isArchitectActive && isPeriodValid) {
    return {
      allowed: false,
      reason: `Architect plan limit reached (${ARCHITECT_UPLOADS_PER_MONTH} global uploads). Renewals occur when your monthly subscription cycles.`,
    };
  }

  return {
    allowed: false,
    reason: `Free tier limit reached (${FREE_INVOICE_LIMIT} invoices for this project). Upgrade for more uploads and premium features.`,
  };
}

export async function incrementArchitectUploadCount(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const now = new Date();
  const { data: sub } = await admin
    .from("user_subscriptions")
    .select("status, invoice_uploads_count, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!sub || sub.status !== "active") return;

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
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
