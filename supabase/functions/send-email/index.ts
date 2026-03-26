import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserIdFromRequest } from "../_shared/auth.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { logEdge } from "../_shared/log.ts";
import { getServiceClient } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

const MAX_SUBJECT_LEN = 200;
const MAX_HTML_LEN = 50_000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = checkRateLimit(req);
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
    const userEmail = authUser?.user?.email;
    if (!userEmail) {
      return jsonResponse({ error: "Could not resolve user email." }, 400, req);
    }

    const body = (await req.json().catch(() => null)) as {
      subject?: string;
      html?: string;
    } | null;

    const subject =
      typeof body?.subject === "string"
        ? body.subject.slice(0, MAX_SUBJECT_LEN)
        : "";
    const html =
      typeof body?.html === "string" ? body.html.slice(0, MAX_HTML_LEN) : "";

    if (!subject || !html) {
      return jsonResponse(
        { error: "Missing required fields: subject, html" },
        400,
        req,
      );
    }

    const { data, error } = await resend.emails.send({
      from: "BLUPRNT.AI Notifications <connect@monarch-labs.com>",
      to: userEmail,
      subject,
      html,
    });

    if (error) {
      logEdge("error", "send-email Resend failed", {
        detail:
          error instanceof Error ? (error as Error).message : String(error),
      });
      return jsonResponse(
        { error: "Could not send email. Please try again." },
        500,
        req,
      );
    }

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
