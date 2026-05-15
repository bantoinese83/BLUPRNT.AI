import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { callGemini } from "../_shared/gemini.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const { projectType, zipCode } = await req.json();

    if (!projectType || !zipCode) {
      return jsonResponse(
        { error: "projectType and zipCode are required" },
        400,
        req
      );
    }

    const systemInstruction = `
      You are the "Intelligence Coordinator" for BLUPRNT.AI. 
      Your job is to generate a dynamic, highly professional set of loading status messages and a brief market context for a user starting a home renovation estimate.
      
      User Project: ${projectType}
      User Location: ${zipCode}
      
      Return a JSON object:
      {
        "status_messages": string[], // Exactly 5 messages. Make them sound smart, technical, and local.
        "market_bulletin": string, // A one-sentence professional insight about this market or project type in 2026.
        "value_tips": string[] // 2 specific value engineering tips for this project type.
      }
      
      Example messages for Austin Kitchen:
      "Analyzing Austin Q2 permit trends for residential kitchens...",
      "Calculating mobilization costs for 78704 contractors...",
      "Cross-referencing historical SKU pricing from Central Texas distributors...",
      "Validating regional labor scarcity modifiers...",
      "Simulating value-engineering scenarios for mid-tier finishes..."
    `;

    const response = await callGemini({
      parts: [{ text: `Generate onboarding context for a ${projectType} in ZIP ${zipCode}` }],
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.7, // A bit of variety is good here
    });

    if (!response || !response.data) {
      throw new Error("Failed to generate context from Gemini");
    }

    return jsonResponse(response.data, 200, req);
  } catch (e) {
    console.error("[get-onboarding-context] Error:", e);
    const message = e instanceof Error ? e.message : "Context generation failed.";
    return jsonResponse({ error: message }, 500, req);
  }
});
