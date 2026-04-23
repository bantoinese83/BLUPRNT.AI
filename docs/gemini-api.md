# Gemini AI Integration

BLUPRNT.AI uses Google Gemini for deep vision renovation analysis, document OCR, and project-intelligent chat.

## 🛠 Configuration

Intelligence is powered by Supabase Edge Functions. The following secrets must be set in your Supabase project:

| Secret                  | Required | Description                                                                                                           |
| :---------------------- | :------- | :-------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`        | Yes      | Your Google AI Studio API Key.                                                                                        |
| `GEMINI_MODEL`          | No       | Model id for all `callGemini` usages. Default: `gemini-3.1-flash-lite-preview`. Do **not** set deprecated legacy ids. |
| `GEMINI_RETRY_ATTEMPTS` | No       | Max retries for transient 503/429 errors. Default: 3.                                                                 |

### Updating the Model

1. Set **`GEMINI_MODEL`** to a current Flash id (e.g. `gemini-3.1-flash-lite-preview`) or **delete** the secret so the code default applies. A lingering legacy value overrides the repo default and can cause errors or overload responses.
2. Deploy the functions: `supabase functions deploy photo-to-scope upload-invoice chat-with-project`.

---

## 🧠 Best Practices for Edge Functions

### 1. Token Limits

Google Flash models have large windows, but Edge Functions are limited by wall-clock time (usually 60–150s).

- **OCR**: Limit to 1 document at a time for maximum precision.
- **Vision**: `photo-to-scope` is capped at 4 photos per request to ensure the analysis completes within the Edge execution window.

### 2. Model Deprecations

- **Avoid** legacy models — they are deprecated / sunset per [deprecations](https://ai.google.dev/gemini-api/docs/deprecations). If your Supabase secret still sets an old model, remove or replace it and redeploy.

### 3. Error Handling

The `_shared/gemini.ts` utility handles:

- **Exponential Backoff**: Automatic retries for `503` (Overloaded) and `429` (Rate Limited).
- **Stream Sanitization**: Correctly parses JSON from text responses, even if the model includes markdown formatting.

---

**BLUPRNT.AI is optimized for Gemini 3.1 Flash. Performance and cost-efficiency are best with the latest Flash architecture.**
