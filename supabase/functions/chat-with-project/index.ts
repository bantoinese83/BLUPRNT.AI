import "@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { assertProjectOwner, getServiceClient, getUserIdFromRequest } from "../_shared/auth.ts";
import {
  callGemini,
  generateEmbedding,
  type GeminiPart,
} from "../_shared/gemini.ts";
import { chatWithProjectSchema } from "../_shared/validation.ts";

const MAX_HISTORY_CHARS = 2000;
const MAX_GEMINI_CONTENT_BLOCKS = 14;

/**
 * Maps client `history` + latest `query` to Gemini `contents` (roles user/model).
 * Strips leading assistant-only turns and folds a trailing orphan user into `query`.
 */
function buildGeminiChatContents(
  history: { role: "user" | "assistant"; content: string }[] | undefined,
  query: string,
): { role: "user" | "model"; parts: GeminiPart[] }[] {
  const trimMsg = (s: string) => {
    const t = s.trim();
    if (t.length <= MAX_HISTORY_CHARS) return t;
    return `${t.slice(0, MAX_HISTORY_CHARS)}…`;
  };

  let q = trimMsg(query);
  const entries = (history ?? []).map((h) => ({
    role: h.role,
    content: trimMsg(h.content),
  }));

  let start = 0;
  while (start < entries.length && entries[start]!.role === "assistant") {
    start += 1;
  }
  const sliced = entries.slice(start).slice(-MAX_GEMINI_CONTENT_BLOCKS);

  while (sliced.length > 0 && sliced[sliced.length - 1]!.role === "user") {
    const dangling = sliced.pop()!;
    q = `${dangling.content}\n\n${q}`;
  }

  const out: { role: "user" | "model"; parts: GeminiPart[] }[] = [];
  for (const m of sliced) {
    out.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  out.push({ role: "user", parts: [{ text: q }] });
  return out;
}

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
    const { query, projectId, history } = parsed.data;
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
      type: "object",
      properties: {
        reply: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["add_scope", "update_scope", "suggest_photo"] },
              data: { type: "object" },
              reason: { type: "string" },
            },
            required: ["type", "data", "reason"],
          },
        },
      },
      required: ["reply", "actions"],
    };

    const systemInstruction = `
      You are an elite Senior Renovation Consultant, Architect, and Value Engineering Expert for BLUPRNT.AI.
      Your mission is to provide hyper-personalized, context-aware, data-driven advice to the homeowner based on their specific project ledger, planned scope, and uploaded documents.
      
      Current Project Context:
      ${contextStr}
      
      Conversation:
      The user message may be part of an ongoing chat. Use prior turns for continuity, pronouns, and follow-ups. If earlier turns conflict with the project context above, trust the context block.
      
      Advanced Analytical Directives:
      1. **Budget Health & Variance**: Compare their total spent from recent ledger records against their estimated budget range ($${project.estimated_min_total} - $${project.estimated_max_total}). If expenditure is pacing high or nearing the ceiling, immediately offer actionable Value Engineering alternatives (e.g., swapping premium stone for high-grade quartz, retaining existing framing).
      2. **Ledger Anomaly Detection**: Review recent ledger records. If you notice duplicate vendor charges, unusually high line items, or unpaid invoices nearing due dates, highlight them clearly.
      3. **Milestone & Phase Guidance**: Based on the project stage (${project.stage}) and scope items, provide phase-specific advice (e.g., permits and rough-in checks during framing, waterproofing during tile prep, punch-list validation during finish).
      4. **Maintenance & Longevity**: Offer expert maintenance advice for materials listed in their scope or receipts (e.g., sealing grout, HVAC filter schedules, roofing warranty preservation).
      5. **No Hallucinations**: Rely strictly on the data provided in the context. If a detail is unknown, ask clarifying questions rather than guessing.
      
      Actionable Intelligence & Workflow Integration:
      You can suggest specific, interactive actions to the user to keep their project on track. Use the "actions" field for:
      - "add_scope": When the user mentions work, fixtures, or trades that aren't in their current scope items.
      - "update_scope": When the user wants to adjust quantities, review finish tiers, or explore cost-saving material swaps.
      - "suggest_photo": When the user reaches a milestone, discusses visual changes, or asks for a visual appraisal of ongoing work.
      
      CRITICAL: Return ONLY valid JSON matching the schema. No prose outside the JSON object. The "reply" string may use markdown (headings, lists, bold) for readability; keep "actions" machine-oriented.
    `;

    console.log("[chat-with-project] Calling Gemini...");
    const contents = buildGeminiChatContents(history, query);
    const result = await callGemini({
      contents,
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
