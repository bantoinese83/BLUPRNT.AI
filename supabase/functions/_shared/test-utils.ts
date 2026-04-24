/**
 * Minimal test utilities for mocking Supabase fetch calls in Deno tests.
 */

export function mockFetch(responses: Record<string, any>) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : "url" in input ? input.url : input.toString();
    const method = init?.method ?? "GET";
    
    // Pattern match - sort by length descending to match more specific paths first
    const sortedEntries = Object.entries(responses).sort((a, b) => b[0].length - a[0].length);
    for (const [key, value] of sortedEntries) {
      if (url.includes(key)) {
        const responseData = typeof value === "function" ? await value(url, init) : value;
        if (responseData instanceof Response) return responseData;
        return new Response(JSON.stringify(responseData), { status: 200 });
      }
    }

    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      return new Response(JSON.stringify({ error: "Unmocked local request" }), { status: 404 });
    }



    return originalFetch(input, init);


  };

  return () => {
    globalThis.fetch = originalFetch;
  };
}


/**
 * Mocks the common Auth and Service Role environment.
 */
export function setupTestEnv() {
  Deno.env.set("SUPABASE_URL", "http://localhost:54321");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
}
