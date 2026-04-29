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
    console.log(`[chat-with-project] Handling request for project ${projectId}, query: ${query.substring(0, 50)}...`);

    const admin = getServiceClient();
    await assertProjectOwner(admin, projectId, userId);

    console.log("[chat-with-project] Fetching project context...");
    const [projectRes, _docsRes, ledgerRes, scopeRes] = await Promise.all([
      admin.from("projects").select("*").eq("id", projectId).single(),
      admin.from("documents").select("*").eq("project_id", projectId),
      admin.from("ledger_entries").select("*").eq("project_id", projectId),
      admin.from("scope_items").select("*").eq("project_id", projectId),
    ]);

    if (projectRes.error || !projectRes.data) {
      console.warn("[chat-with-project] Project not found or error:", projectRes.error);
      return jsonResponse({ error: "Project not found" }, 404, req);
    }

    const project = projectRes.data;
    const scope = (scopeRes.data || []).slice(0, 50);
    const ledgerEntries = (ledgerRes.data || []).slice(0, 20);

    console.log(`[chat-with-project] Found ${scope.length} scope items and ${ledgerEntries.length} ledger entries.`);

    // 1. Semantic Retrieval
    let semanticDocsContext = "";
    try {
      console.log("[chat-with-project] Generating embedding for query...");
      const queryEmbedding = await generateEmbedding(query);
      if (queryEmbedding) {
        console.log("[chat-with-project] Matching embeddings in DB...");
        const { data: matchedDocs, error: rpcErr } = await admin.rpc("match_document_embeddings", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          p_project_id: projectId,
        });

        if (rpcErr) {
          console.error("[chat-with-project] RPC error:", rpcErr);
        } else if (matchedDocs && matchedDocs.length > 0) {
          console.log(`[chat-with-project] Found ${matchedDocs.length} relevant document snippets.`);
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
        { vendor_name: string; total: number; payment_status: string; ai_summary: string | null }
      >).map((i) =>
        `- ${i.vendor_name || "Vendor"}: $${i.total} (${i.payment_status})${i.ai_summary ? ` - Summary: ${i.ai_summary}` : ""}`
      ).join("\n")
    }
    ${semanticDocsContext}
    `;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        reply: { type: "STRING" },
        actions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: ["add_scope", "update_scope", "suggest_photo"] },
              data: { type: "OBJECT" },
              reason: { type: "STRING" },
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
      
      CRITICAL: You MUST return ONLY valid JSON matching the exact schema provided. Do not include any conversational preamble, markdown formatting, or greeting. Your entire response must be parseable by JSON.parse().
    `;

    console.log("[chat-with-project] Calling Gemini...");
    const result = await callGemini({
      parts: [{ text: query }],
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    });

    if (!result) {
      console.error("[chat-with-project] callGemini returned null");
      throw new Error("Failed to generate response from Gemini");
    }

    let parsedResponse;
    if (result.data) {
      parsedResponse = result.data;
    } else {
      let text = result.text || '{"reply": "I couldn’t process that.", "actions": []}';
      if (text.startsWith("```")) {
        text = text.replace(/^```+(json)?\s*/i, "").replace(/\s*```+$/i, "");
      }
      try {
        parsedResponse = JSON.parse(text);
      } catch (e) {
        console.error("[chat-with-project] Failed to parse JSON. Raw text:", text);
        throw new Error("Invalid response format from AI");
      }
    }
    console.log("[chat-with-project] Success. Reply length:", parsedResponse.reply?.length || 0);

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
    console.error("[chat-with-project] FATAL ERROR:", error);
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
