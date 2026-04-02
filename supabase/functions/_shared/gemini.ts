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
}): Promise<GeminiResponse | null> {
  // @ts-expect-error: Deno global
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
  } = params;

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

    console.log(`[callGemini] Calling New SDK (Model: gemini-3-flash-preview)`);

    // 3. Execute request using the centralized config pattern
    const response = (await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: sdkContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        maxOutputTokens: 8192,
        responseMimeType: responseMimeType,
        responseSchema: responseSchema,
      },
    })) as { text?: string; data?: Record<string, unknown> };

    if (!response || !response.text) {
      console.warn("[callGemini] No response text returned");
      return null;
    }

    return {
      text: response.text.trim(),
      data: response.data, // The new SDK often parses the data automatically if schema is provided
    };
  } catch (e: unknown) {
    const error = e as Error;
    console.error("[callGemini] New SDK Error:", error.name, error.message);
    return { text: `ERROR: ${error.message}` };
  }
}
