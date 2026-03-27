import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  getServiceClient,
  getUserIdFromRequest,
  assertProjectOwner,
} from "../_shared/auth.ts";
import { callGemini } from "../_shared/gemini.ts";

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, req);
    }

    const { query, projectId } = await req.json();
    if (!projectId || !query) {
      return jsonResponse({ error: "Missing projectId or query" }, 400, req);
    }

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    // 1. Fetch Project Context
    const [projectRes, scopeRes, invoiceRes] = await Promise.all([
      admin.from("projects").select("*").eq("id", projectId).single(),
      admin.from("scope_items").select("*").eq("project_id", projectId),
      admin.from("invoices").select("*").eq("project_id", projectId),
    ]);

    const project = projectRes.data;
    const scope = scopeRes.data || [];
    const invoices = invoiceRes.data || [];

    const contextStr = `
      Project: ${project.name}
      Stage: ${project.stage}
      Budget Estimate: $${project.estimated_min_total} - $${project.estimated_max_total}
      
      Scope Items:
      ${scope.map((s: any) => `- ${s.category}: ${s.description} ($${s.total_cost_min}-$${s.total_cost_max})`).join("\n")}
      
      Current Invoices:
      ${invoices.map((i: any) => `- ${i.vendor_name || "Vendor"}: $${i.total} (${i.payment_status})`).join("\n")}
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
  } catch (e: any) {
    console.error(e);
    return jsonResponse(
      { error: e.message || "Internal server error" },
      500,
      req,
    );
  }
});
