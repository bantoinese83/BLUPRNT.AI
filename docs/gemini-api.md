# Gemini API in BLUPRNT (Edge Functions)

Supabase Edge Functions call the **Google Gemini API** over **REST** (`generateContent`). This doc matches how the repo is wired and points to Google’s current references.

## Official documentation (Google AI)

| Topic | URL |
|--------|-----|
| Models (names, tiers, deprecations) | https://ai.google.dev/gemini-api/docs/models |
| Text generation (REST `contents`, `parts`) | https://ai.google.dev/gemini-api/docs/text-generation |
| Tools (built-in vs function calling) | https://ai.google.dev/gemini-api/docs/tools |
| Grounding with Google Search | https://ai.google.dev/gemini-api/docs/google-search |

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | API key from [Google AI Studio](https://aistudio.google.com/) or Google Cloud. |
| `GEMINI_MODEL` | No | Model id for all `callGemini` usages. Default: `gemini-2.5-flash`. |

\*Invoice OCR and photo estimates are degraded or skipped when the key is missing, depending on the function.

## Code layout

| File | Role |
|------|------|
| [`supabase/functions/_shared/gemini.ts`](../supabase/functions/_shared/gemini.ts) | `callGemini()` — `v1beta` REST, optional `google_search` tool, JSON schema responses. |
| [`supabase/functions/_shared/ocr.ts`](../supabase/functions/_shared/ocr.ts) | Invoice PDF/image → structured fields (uses `callGemini`, no search grounding). |
| [`supabase/functions/photo-to-scope/_shared/estimate.ts`](../supabase/functions/photo-to-scope/_shared/estimate.ts) | Renovation estimate JSON + **`useGrounding: true`** for local market context. |

## Model choice

- Default **`gemini-2.5-flash`** is a stable, cost-effective multimodal model and supports **Grounding with Google Search** per Google’s [supported models](https://ai.google.dev/gemini-api/docs/google-search#supported_models) table.
- Override with **`GEMINI_MODEL`** when you want e.g. `gemini-2.5-pro` (heavier reasoning) or a newer stable id from the [models](https://ai.google.dev/gemini-api/docs/models) page.
- Avoid deprecated / shut-down ids listed on [deprecations](https://ai.google.dev/gemini-api/docs/deprecations).

## Grounding with Google Search

- Request body includes tools: `[{ "google_search": {} }]` (not the legacy `google_search_retrieval` tool).
- Responses may include `groundingMetadata` (e.g. `webSearchQueries`, `groundingChunks`). The shared client logs search queries when present.
- Pricing for search grounding can differ by model generation; see [pricing](https://ai.google.dev/gemini-api/docs/pricing) and the [Google Search grounding](https://ai.google.dev/gemini-api/docs/google-search) doc.

## Request shape

- **Contents**: a single `user` turn with **multiple `parts`** (text + optional `inlineData` for images/PDFs), aligned with the REST examples in [text generation](https://ai.google.dev/gemini-api/docs/text-generation).
- **Structured JSON**: `generationConfig.responseMimeType` + `responseSchema` for invoice OCR and estimates (see [structured output](https://ai.google.dev/gemini-api/docs/structured-output) when you change schemas).

## Deploying functions that use Gemini

After setting secrets, redeploy any function that imports `_shared/gemini.ts` or `ocr.ts`:

```bash
npx supabase functions deploy photo-to-scope upload-invoice --project-ref YOUR_PROJECT_REF
```

(`photo-to-scope` bundles `estimate.ts`; `upload-invoice` uses `ocr.ts`.)
