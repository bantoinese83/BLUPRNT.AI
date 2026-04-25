import { GoogleGenAI } from "npm:@google/genai@1.46.0";

/**
 * Shared Gemini AI utilities for Supabase Edge Functions.
 * Fully migrated to the NEW Google GenAI SDK architecture (2025/2026).
 */

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export interface GeminiResponse {
  text: string;
  data?: Record<string, unknown>;
  groundingMetadata?: Record<string, unknown>;
}

/**
 * Strips markdown code blocks and attempts to parse JSON.
 * High-fidelity fallback for when Gemini includes conversational text or markers.
 */
function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    let clean = text.trim();
    // Remove markdown code blocks if present
    if (clean.includes("```")) {
      const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) clean = match[1];
    }
    // Remove leading/trailing non-json chars (like extra text Gemini might add)
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[gemini-util] JSON Parse failed:", msg);
    return null;
  }
}

/** True when Google returns overload / rate limits — safe to retry with backoff. */
function isRetryableGeminiError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|heavy load|try again later|temporarily unavailable/i
    .test(msg);
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

export async function callGemini(params: {
  parts: GeminiPart[];
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  tools?: any[];
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
    maxOutputTokens = 4096,
    timeoutMs = 90_000,
    tools,
  } = params;

  const modelName =
    (Deno.env.get("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL).trim() ||
    DEFAULT_GEMINI_MODEL;

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      const delayMs = Math.min(4000, 400 * Math.pow(2, attempt - 2));
      await new Promise((r) => setTimeout(r, delayMs));
    }

    try {
      // New SDK uses GoogleGenAI client architecture
      const client = new GoogleGenAI({ apiKey });

      // Transform parts to the format expected by @google/genai
      const contents = parts.map((p) => {
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

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini API Timeout (${timeoutMs / 1000}s)`)),
          timeoutMs,
        )
      );

      const config: any = {
        systemInstruction,
        temperature,
        maxOutputTokens,
        responseMimeType,
        responseSchema: responseSchema as any,
      };

      if (tools) {
        config.tools = tools;
      }

      const callPromise = client.models.generateContent({
        model: modelName,
        contents,
        config,
      });

      const response = await Promise.race([callPromise, timeoutPromise]);

      const text = response.text;
      if (!text) {
        console.warn("[callGemini] No usable text in response");
        return null;
      }

      let data: Record<string, unknown> | undefined;
      if (responseMimeType === "application/json") {
        data = tryParseJson(text) ?? undefined;
      }

      const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;

      return { text, data, groundingMetadata };
    } catch (e: unknown) {
      const error = e as Error;
      console.error(
        `[callGemini] Attempt ${attempt} failed:`,
        error.name,
        error.message,
      );

      // Detailed logging for SDK errors
      if (error.stack) console.error(error.stack);

      if (!isRetryableGeminiError(e) || attempt === DEFAULT_MAX_ATTEMPTS) {
        return null;
      }
    }
  }

  return null;
}
