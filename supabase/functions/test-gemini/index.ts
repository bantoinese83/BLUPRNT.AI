import { getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  try {
    const admin = getServiceClient();
    const { data, error } = await admin
      .from("document_processing_queue")
      .select("*")
      .eq("id", "8884be9e-a4f5-4ac9-b531-bd86d0584402")
      .single();
    
    return new Response(JSON.stringify({ 
      data, 
      error 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
