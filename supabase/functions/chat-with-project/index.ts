import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import {
  getServiceClient,
  getUserIdFromRequest,
  assertProjectOwner,
} from "../_shared/auth.ts";
import { callGemini } from "../_shared/gemini.ts";
import { chatWithProjectSchema } from "../_shared/validation.ts";

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = await checkRateLimit(req, "ai");
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

    const raw = await req.json().catch(() => null);
    const parsed = chatWithProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse(
        { error: "Invalid projectId or query" },
        400,
        req,
      );
    }
    const { query, projectId } = parsed.data;

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    const [projectRes, scopeRes, invoiceRes] = await Promise.all([
      admin.from("projects").select("*").eq("id", projectId).single(),
      admin.from("scope_items").select("*").eq("project_id", projectId),
      admin.from("invoices").select("*").eq("project_id", projectId),
    ]);

    if (projectRes.error || !projectRes.data) {
      return jsonResponse({ error: "Project not found" }, 404, req);
    }

    const project = projectRes.data;
    const scope = scopeRes.data || [];
    const invoices = invoiceRes.data || [];

    const contextStr = `
      Project: ${project.name}
      Stage: ${project.stage}
      Budget Estimate: $${project.estimated_min_total} - $${project.estimated_max_total}
      
      Scope Items:
      ${(scope as Array<{ category: string; description: string; total_cost_min: number; total_cost_max: number }>).map((s) => `- ${s.category}: ${s.description} ($${s.total_cost_min}-$${s.total_cost_max})`).join("\n")}
      
      Current Invoices:
      ${(invoices as Array<{ vendor_name: string; total: number; payment_status: string }>).map((i) => `- ${i.vendor_name || "Vendor"}: $${i.total} (${i.payment_status})`).join("\n")}
    `;

    const systemInstruction = `
      You are a professional Renovation Consultant for BLUPRNT.AI. 
      Your goal is to provide specific, data-driven advice to a homeowner based on their project details.
      
      Current Project Context:
      ${contextStr}
      
      Guidelines:
      1. Be professional, encouraging, and concise.
      2. If they are over budget, suggest "Value Engineering" tips.
      3. If they are missing scope in a specific category, suggest common additions.
      4. Always refer to their specific data when possible.
      5. Do not hallucinate data that isn't provided.
    `;

    const result = await callGemini({
      parts: [{ text: query }],
      systemInstruction,
      responseMimeType: "text/plain",
      temperature: 0.7,
    });

    return jsonResponse(
      { reply: result?.text || "I'm sorry, I couldn't generate a response." },
      200,
      req,
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.error(error);
    if (error.message === "not_found") {
      return jsonResponse({ error: "Project not found" }, 404, req);
    }
    if (error.message === "forbidden") {
      return jsonResponse({ error: "Access denied" }, 403, req);
    }
    return jsonResponse(
      { error: error.message || "Internal server error" },
      500,
      req,
    );
  }
});
