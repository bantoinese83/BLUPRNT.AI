import { GoogleGenAI } from "npm:@google/genai";

/**
 * Shared Gemini AI utilities for Supabase Edge Functions.
 * Migrated to the LATEST Google GenAI SDK architecture (2025/2026).
 */

export type GeminiPart = 
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export async function callGemini(params: {
  parts: GeminiPart[];
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: any;
  temperature?: number;
}): Promise<string | null> {
  // @ts-ignore: Deno global
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) {
    console.error("[callGemini] GEMINI_API_KEY not found in environment");
    return null;
  }

  const { parts, systemInstruction, responseMimeType = "application/json", responseSchema, temperature = 0.1 } = params;
  
  try {
    // 1. Initialize the new unified Client
    const ai = new GoogleGenAI({ apiKey });

    // 2. Format parts for the new SDK structure
    const sdkContents = parts.map(p => {
      if ("inline_data" in p) {
        return {
          inlineData: {
            mimeType: p.inline_data.mime_type,
            data: p.inline_data.data
          }
        };
      }
      return { text: p.text };
    });

    console.log(`[callGemini] Calling New SDK (Model: gemini-2.5-flash, Schema: ${!!responseSchema})`);

    // 3. Execute request using the centralized config pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: sdkContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: temperature,
        maxOutputTokens: 8192,
        responseMimeType: responseMimeType,
        responseSchema: responseSchema,
      },
    });

    if (!response || !response.text) {
      console.warn("[callGemini] No response text returned");
      return null;
    }

    return response.text.trim();
  } catch (e: any) {
    console.error("[callGemini] New SDK Error:", e.message);
    return `ERROR: ${e.message}`;
  }
}
