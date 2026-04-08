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

    const callPromise = ai.models.generateContent({
      model,
      contents: sdkContents,
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

    const response = (await Promise.race([callPromise, timeoutPromise])) as {
      text?: string;
      data?: Record<string, unknown>;
    };

    if (!response || !response.text) {
      console.warn("[callGemini] No response text returned");
      return null;
    }

    return {
      text: response.text.trim(),
      data: response.data,
    };
  } catch (e: unknown) {
    const error = e as Error;
    console.error("[callGemini] New SDK Error:", error.name, error.message);
    return null;
  }
}
