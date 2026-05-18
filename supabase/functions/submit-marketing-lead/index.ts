import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getServiceClient } from "../_shared/auth.ts";
import { marketingLeadSchema } from "../_shared/validation.ts";
import { logEdge } from "../_shared/log.ts";
import { MARKETING_DISCOUNT_PROMO_CODE } from "../../../shared/constants/marketing-discount.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";

import { PUBLIC_SITE_ORIGIN } from "../../../shared/constants/public-site.ts";

function getAppBaseUrl(): string {
  const env = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
  return env || PUBLIC_SITE_ORIGIN;
}

function discountEmailHtml(): string {
  const baseUrl = getAppBaseUrl();
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
<h1 style="color: #14b8a6; text-transform: uppercase; tracking: tight;">35% OFF LOCKED IN</h1>
<p>Hello!</p>
<p>You recently asked for a discount on BLUPRNT.AI. Your code is below:</p>
<div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; border-radius: 12px; margin: 24px 0;">
<span style="font-size: 24px; font-weight: 900; letter-spacing: 2px;">${MARKETING_DISCOUNT_PROMO_CODE}</span>
</div>
<p>This code gives you <strong>35% off</strong> the Architect Plan or a single Project Pass.</p>
<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
<p style="font-size: 14px; color: #64748b;">
You can continue in your <a href="${baseUrl}/dashboard" style="color: #14b8a6; text-decoration: none; font-weight: bold;">Dashboard</a>.
</p>
</div>`;
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req, "marketing");
  if (!ok) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      req,
      retryAfter ?? 60,
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = marketingLeadSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return jsonResponse({ error: msg }, 400, req);
    }

    const { email, source } = parsed.data;
    const admin = getServiceClient();
    const { error: insErr } = await admin.from("marketing_leads").insert({
      email,
      source,
    });
    if (insErr) {
      const duplicate =
        insErr.code === "23505" ||
        /duplicate|unique/i.test(insErr.message ?? "");
      if (!duplicate) {
        logEdge("error", "submit-marketing-lead insert", {
          detail: insErr.message,
        });
        return jsonResponse({ error: "Could not save your request." }, 500, req);
      }
    }

    if (BREVO_API_KEY.trim()) {
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
          to: [{ email }],
          subject: "Your 35% Discount Code for BLUPRNT.AI",
          htmlContent: discountEmailHtml(),
        }),
      });
      if (!brevoResponse.ok) {
        logEdge("warn", "submit-marketing-lead Brevo failed", {
          detail: await brevoResponse.text(),
        });
      }
    }

    return jsonResponse(
      { success: true, promoCode: MARKETING_DISCOUNT_PROMO_CODE },
      200,
      req,
    );
  } catch (e) {
    logEdge("error", "submit-marketing-lead", {
      detail: e instanceof Error ? e.message : String(e),
    });
    return jsonResponse({ error: "Something went wrong." }, 500, req);
  }
});
