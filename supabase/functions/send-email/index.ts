import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getUserIdFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { logEdge } from "../_shared/log.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { sanitizeUserEmailHtml } from "../_shared/sanitize-email-html.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";

const MAX_SUBJECT_LEN = 200;
const MAX_HTML_LEN = 50_000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRecipients(
  toField: unknown,
  userEmail: string | undefined,
): { ok: true; emails: string[] } | { ok: false; error: string } {
  if (!userEmail) {
    return { ok: false, error: "Could not resolve user email." };
  }
  const normalizedUser = userEmail.trim().toLowerCase();

  if (toField == null || toField === "") {
    return { ok: true, emails: [normalizedUser] };
  }

  const list = Array.isArray(toField) ? toField : [toField];
  const emails = list
    .map((v) => String(v).trim().toLowerCase())
    .filter((e) => e.length > 0);

  if (emails.length === 0) {
    return { ok: true, emails: [normalizedUser] };
  }

  for (const e of emails) {
    if (!EMAIL_RE.test(e) || e.length > 320) {
      return { ok: false, error: "Invalid recipient address." };
    }
    if (e !== normalizedUser) {
      return {
        ok: false,
        error: "You can only send email to your own account address.",
      };
    }
  }

  return { ok: true, emails: [...new Set(emails)] };
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req);
  if (!ok) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      req,
      retryAfter ?? 60,
    );
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const admin = getServiceClient();
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email?.toLowerCase();

    const body = (await req.json().catch(() => null)) as {
      subject?: string;
      html?: string;
      to?: string | string[];
    } | null;

    const subject =
      typeof body?.subject === "string"
        ? body.subject.slice(0, MAX_SUBJECT_LEN)
        : "";
    const rawHtml =
      typeof body?.html === "string" ? body.html.slice(0, MAX_HTML_LEN) : "";
    const html = rawHtml ? sanitizeUserEmailHtml(rawHtml) : "";

    if (!subject || !html) {
      return jsonResponse(
        { error: "Missing required fields: subject, html" },
        400,
        req,
      );
    }

    const rec = normalizeRecipients(body?.to, userEmail);
    if (!rec.ok) {
      return jsonResponse({ error: rec.error }, 400, req);
    }

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "BLUPRNT.AI Notifications",
          email: "connect@monarch-labs.com",
        },
        to: rec.emails.map((email) => ({ email })),
        subject: subject,
        htmlContent: html,
      }),
    });

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      logEdge("error", "send-email Brevo failed", {
        detail: errorData,
      });
      return jsonResponse(
        { error: "Could not send email. Please try again." },
        500,
        req,
      );
    }

    const data = await brevoResponse.json();
    return jsonResponse({ data }, 200, req);
  } catch (error) {
    logEdge("error", "send-email unexpected", {
      detail: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { error: "Could not send email. Please try again." },
      500,
      req,
    );
  }
});
