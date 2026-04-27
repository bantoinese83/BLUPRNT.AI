import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { assertProjectOwner, getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import { callGemini, generateEmbedding } from "../_shared/gemini.ts";
import { chatWithProjectSchema } from "../_shared/validation.ts";

export const handler = async (req: Request) => {
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

    const [projectRes, _docsRes, ledgerRes, scopeRes] = await Promise.all([
      admin.from("projects").select("*").eq("id", projectId).single(),
      admin.from("documents").select("*").eq("project_id", projectId),
      admin.from("ledger_entries").select("*").eq("project_id", projectId),
      admin.from("scope_items").select("*").eq("project_id", projectId),
    ]);

    if (projectRes.error || !projectRes.data) {
      return jsonResponse({ error: "Project not found" }, 404, req);
    }

    const project = projectRes.data;
    const scope = (scopeRes.data || []).slice(0, 50); // Keep scope manageable
    const ledgerEntries = (ledgerRes.data || []).slice(0, 20); // Top recent records

    // 1. Semantic Retrieval for additional context
    let semanticDocsContext = "";
    try {
      const queryEmbedding = await generateEmbedding(query);
      if (queryEmbedding) {
        const { data: matchedDocs } = await admin.rpc("match_document_embeddings", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          p_project_id: projectId,
        });

        if (matchedDocs && matchedDocs.length > 0) {
          semanticDocsContext = "\nRelevant Documents found via Semantic Search:\n" +
            (matchedDocs as any[]).map((d) => `- ${d.content}`).join("\n");
        }
      }
    } catch (semErr) {
      console.warn("[chat-with-project] Semantic search failed:", semErr);
    }

    const contextStr = `
      Project: ${project.name}
      Stage: ${project.stage}
      Budget Estimate: $${project.estimated_min_total} - $${project.estimated_max_total}
      
      Scope Items:
      ${
      (scope as Array<
        {
          category: string;
          description: string;
          total_cost_min: number;
          total_cost_max: number;
        }
      >).map((s) =>
        `- ${s.category}: ${s.description} ($${s.total_cost_min}-$${s.total_cost_max})`
      ).join("\n")
    }
      
      Recent Ledger Records:
      ${
      (ledgerEntries as Array<
        { vendor_name: string; total: number; payment_status: string }
      >).map((i) =>
        `- ${i.vendor_name || "Vendor"}: $${i.total} (${i.payment_status})`
      ).join("\n")
    }
    ${semanticDocsContext}
    `;

    const responseSchema = {
      type: "object",
      properties: {
        reply: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["add_scope", "update_scope", "suggest_photo"] },
              data: { type: "object", additionalProperties: true },
              reason: { type: "string" },
            },
            required: ["type", "data", "reason"],
          },
        },
      },
      required: ["reply", "actions"],
    };

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
      
      Actionable Intelligence:
      You can suggest specific actions to the user. Use the "actions" field for:
      - "add_scope": When the user mentions work that isn't in their current scope.
      - "update_scope": When the user wants to change quantities or finish tiers.
      - "suggest_photo": When the user asks for a visual appraisal or has reached a milestone.
    `;

    const result = await callGemini({
      parts: [{ text: query }],
      systemInstruction,
      responseSchema: responseSchema as any,
      temperature: 0.7,
    });

    const parsedResponse = result?.data || JSON.parse(result?.text || '{"reply": "I couldn’t process that.", "actions": []}');

    return jsonResponse(
      {
        reply: parsedResponse.reply,
        actions: parsedResponse.actions || [],
      },
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
};

if (import.meta.main) {
  Deno.serve(handler);
}
