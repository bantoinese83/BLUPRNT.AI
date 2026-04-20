# Gemini API in BLUPRNT (Edge Functions)

Supabase Edge Functions call the **Google Gemini API** over **REST** (`generateContent`). This doc matches how the repo is wired and points to Google’s current references.

## Official documentation (Google AI)

| Topic                                      | URL                                                   |
| ------------------------------------------ | ----------------------------------------------------- |
| Models (names, tiers, deprecations)        | https://ai.google.dev/gemini-api/docs/models          |
| Text generation (REST `contents`, `parts`) | https://ai.google.dev/gemini-api/docs/text-generation |
| Tools (built-in vs function calling)       | https://ai.google.dev/gemini-api/docs/tools           |
| Grounding with Google Search               | https://ai.google.dev/gemini-api/docs/google-search   |

## Secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret           | Required | Description                                                                                                                         |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Yes\*    | API key from [Google AI Studio](https://aistudio.google.com/) or Google Cloud.                                                      |
| `GEMINI_MODEL`   | No       | Model id for all `callGemini` usages. Default: `gemini-2.5-flash`. Do **not** set deprecated `gemini-1.5-flash` (or other 1.5 ids). |

\*Invoice OCR and photo estimates are degraded or skipped when the key is missing, depending on the function.

### Production checklist (avoid silent fallbacks)

1. Set **`GEMINI_MODEL`** to a current Flash id (e.g. `gemini-2.5-flash`) or **delete** the secret so the code default applies. A lingering `gemini-1.5-flash` value overrides the repo default and can cause errors or overload responses.
2. After changing secrets, **redeploy** functions that bundle `_shared/gemini.ts` (e.g. `photo-to-scope`, `upload-invoice`, `chat-with-project`).
3. The **`photo-to-scope`** JSON includes **`used_fallback`** (and **`fallback_reason`**) when the handler used the regional placeholder because Gemini returned no payload. Clients should show `estimateFallbackUserMessage` from `@shared/constants/onboarding` so users are not misled.

## Code layout

| File                                                                                                                | Role                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`supabase/functions/_shared/gemini.ts`](../supabase/functions/_shared/gemini.ts)                                   | `callGemini()` — `v1beta` REST, optional `google_search` tool, JSON schema responses. |
| [`supabase/functions/_shared/ocr.ts`](../supabase/functions/_shared/ocr.ts)                                         | Invoice PDF/image → structured fields (uses `callGemini`, no search grounding).       |
| [`supabase/functions/photo-to-scope/_shared/estimate.ts`](../supabase/functions/photo-to-scope/_shared/estimate.ts) | Renovation estimate JSON + **`useGrounding: true`** for local market context.         |

## Model choice

- Default **`gemini-2.5-flash`** is the repo default when `GEMINI_MODEL` is unset.
- **Recommended Flash ids** (pick one via `GEMINI_MODEL`): `gemini-2.5-flash`, `gemini-2.5-flash-lite`, or `gemini-flash-latest` (tracks Google’s latest Flash). Re-check names on the [models](https://ai.google.dev/gemini-api/docs/models) page — aliases can change.
- **Avoid** **`gemini-1.5-flash`** and other 1.5-era ids — they are deprecated / sunset per [deprecations](https://ai.google.dev/gemini-api/docs/deprecations). If your Supabase secret still sets 1.5, remove or replace it and redeploy.
- For heavier reasoning, consider `gemini-2.5-pro` or newer Pro ids from the models doc.
- **Grounding with Google Search**: only some models support it; see Google’s [supported models](https://ai.google.dev/gemini-api/docs/google-search#supported_models) table.

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
