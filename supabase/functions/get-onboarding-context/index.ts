import { callGemini } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { projectType, zipCode } = await req.json();

    if (!projectType || !zipCode) {
      return new Response(
        JSON.stringify({ error: "projectType and zipCode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    return new Response(JSON.stringify(response.data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[get-onboarding-context] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
