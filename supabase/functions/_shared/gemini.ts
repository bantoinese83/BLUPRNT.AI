import { GoogleGenAI } from "npm:@google/genai";

/**
 * Shared Gemini AI utilities for Supabase Edge Functions.
 * Migrated to the LATEST Google GenAI SDK architecture (2025/2026).
 */

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export interface GeminiResponse {
  text: string;
  data?: Record<string, unknown>;
}

/** Some Edge responses omit `text` but still include candidates — merge parts manually. */
function extractTextFromGenerateContentResponse(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;

  const r = response as {
    text?: string;
    promptFeedback?: { blockReason?: string; blockReasonMessage?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  if (typeof r.text === "string" && r.text.trim()) {
    return r.text.trim();
  }

  const blockReason = r.promptFeedback?.blockReason;
  if (blockReason) {
    console.warn("[callGemini] Prompt blocked:", blockReason);
    return "I can’t reply to that. Ask about your project’s budget, scope, timeline, or documents instead.";
  }

  const parts = r.candidates?.[0]?.content?.parts;
  if (parts?.length) {
    const combined = parts
      .map((p) => (p && typeof p.text === "string" ? p.text : ""))
      .join("");
    if (combined.trim()) return combined.trim();
  }

  const finish = r.candidates?.[0]?.finishReason;
  if (finish && finish !== "STOP" && finish !== "MAX_TOKENS") {
    console.warn("[callGemini] Unexpected finishReason:", finish);
  }

  return null;
}

export async function callGemini(params: {
  parts: GeminiPart[];
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  /** Lower for faster responses on Edge (wall-clock limits). Default 8192. */
  maxOutputTokens?: number;
  /** Wall-clock guard for the SDK call (ms). Default 90s for vision JSON. */
  timeoutMs?: number;
}): Promise<GeminiResponse | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) {
    console.error("[callGemini] GEMINI_API_KEY not found in environment");
    return null;
  }

  const {
    parts,
    systemInstruction,
    responseMimeType = "application/json",
    responseSchema,
    temperature = 0.1,
    maxOutputTokens = 8192,
    timeoutMs = 90_000,
  } = params;

  const model =
    (Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash").trim() ||
    "gemini-2.5-flash";

  try {
    // 1. Initialize the new unified Client
    const ai = new GoogleGenAI({ apiKey });

    // 2. Format parts for the new SDK structure
    const sdkContents = parts.map((p) => {
      if ("inline_data" in p) {
        return {
          inlineData: {
            mimeType: p.inline_data.mime_type,
            data: p.inline_data.data,
          },
        };
      }
      return { text: p.text };
    });

    console.log(`[callGemini] generateContent (model: ${model})`);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Gemini API Timeout (${timeoutMs / 1000}s)`)),
        timeoutMs,
      ),
    );

    const contentsArg =
      parts.length === 1 && "text" in parts[0] && !("inline_data" in parts[0])
        ? parts[0].text
        : sdkContents;

    const callPromise = ai.models.generateContent({
      model,
      contents: contentsArg,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        maxOutputTokens,
        responseMimeType: responseMimeType,
        responseSchema: responseSchema,
      },
    });

    // When the timeout wins Promise.race, the SDK promise can still reject later.
    // Unhandled rejections have been observed to crash the Edge isolate (plain 500).
    callPromise.catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[callGemini] Background request settled after race:", msg);
    });

    const response = await Promise.race([callPromise, timeoutPromise]);

    const text = extractTextFromGenerateContentResponse(response);
    if (!text) {
      console.warn("[callGemini] No usable text in response");
      return null;
    }

    const data =
      response && typeof response === "object" && "data" in response
        ? (response as { data?: Record<string, unknown> }).data
        : undefined;

    return {
      text,
      data,
    };
  } catch (e: unknown) {
    const error = e as Error;
    console.error("[callGemini] New SDK Error:", error.name, error.message);
    return null;
  }
}
