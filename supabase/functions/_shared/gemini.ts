// @ts-ignore: OcrInvoiceResult is used in other functions via shared types but flagged as unused here

export interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string; // base64
  };
}

export interface GeminiResponse {
  text: string;
  data?: any;
  groundingMetadata?: any;
}

const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-004";

/**
 * Robustly calls the Gemini API via REST to avoid SDK versioning issues in Edge Functions.
 */
export async function callGemini(params: {
  parts: GeminiPart[];
  systemInstruction?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: any;
  tools?: any[];
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  model?: string;
}): Promise<GeminiResponse | null> {
  const {
    parts,
    systemInstruction,
    responseMimeType = "text/plain",
    responseSchema,
    tools,
    temperature = 0.1,
    maxOutputTokens = 2048,
    timeoutMs = 45000,
    model: modelOverride,
  } = params;

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) {
    console.error("[callGemini] GEMINI_API_KEY not found in environment");
    return null;
  }
  console.log(
    `[callGemini] Using API key: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`,
  );

  const modelName = (
    modelOverride ||
    Deno.env.get("GEMINI_MODEL") ||
    DEFAULT_GEMINI_MODEL
  ).trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Map our internal part format to the Google REST API format
  const contentsParts = parts.map((p, i) => {
    if (p.inline_data) {
      console.log(
        `[callGemini] Part ${i}: inlineData (${p.inline_data.mime_type}), data length: ${p.inline_data.data.length}`,
      );
      return {
        inlineData: {
          mimeType: p.inline_data.mime_type,
          data: p.inline_data.data,
        },
      };
    }
    console.log(`[callGemini] Part ${i}: text, length: ${p.text?.length || 0}`);
    return { text: p.text || "" };
  });

  const body: any = {
    contents: [{ parts: contentsParts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (responseSchema && responseMimeType === "application/json") {
    body.generationConfig.responseSchema = responseSchema;
  }

  if (tools) {
    body.tools = tools;
  }

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const result = await response.json();

      // Log for debugging (don't log full text)
      if (result.promptFeedback) {
        console.log(
          "[callGemini] Prompt feedback:",
          JSON.stringify(result.promptFeedback),
        );
      }

      const candidate = result.candidates?.[0];

      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        console.warn("[callGemini] Finish reason:", candidate.finishReason);
      }

      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        console.warn("[callGemini] No text in response");
        return null;
      }

      let parsedData = null;
      if (responseMimeType === "application/json") {
        try {
          parsedData = JSON.parse(text);
        } catch (e) {
          console.warn("[callGemini] Failed to parse JSON response:", e);
        }
        if (parsedData == null) {
          let t = text.trim();
          if (t.startsWith("```")) {
            t = t.replace(/^```+(json)?\s*/i, "").replace(/\s*```+$/i, "");
          }
          try {
            parsedData = JSON.parse(t);
          } catch {
            /* leave null */
          }
        }
      }

      return {
        text,
        data: parsedData,
        groundingMetadata: candidate?.groundingMetadata,
      };
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`[callGemini] Attempt ${attempt} failed:`, error.message);

      if (attempt === DEFAULT_MAX_ATTEMPTS) return null;

      const delay = Math.min(4000, 500 * Math.pow(2, attempt - 1));
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}

export async function generateEmbedding(
  text: string,
): Promise<number[] | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) {
    console.error(
      "[generateEmbedding] GEMINI_API_KEY not found in environment",
    );
    return null;
  }

  const modelName = (
    Deno.env.get("EMBEDDING_MODEL") || DEFAULT_EMBEDDING_MODEL
  ).trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`;

  for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${modelName}`,
          content: { parts: [{ text }] },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Embedding API error (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const embedding = result.embedding?.values;

      if (!embedding) {
        console.warn("[generateEmbedding] No embedding in response");
        return null;
      }

      return embedding;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(
        `[generateEmbedding] Attempt ${attempt} failed:`,
        error.message,
      );

      if (attempt === DEFAULT_MAX_ATTEMPTS) return null;

      const delay = Math.min(4000, 500 * Math.pow(2, attempt - 1));
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}
