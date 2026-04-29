# BLUPRNT.AI (v3) - Project Instructions

## Architecture & Conventions

### Monorepo Structure

- `web/`: React 19 SPA (Vite, Tailwind, TanStack Query).
- `mobile/`: Expo Native app (Expo Router, Moti, Haptics).
- `shared/`: Source of truth for types, database schemas, and logic.
- `supabase/`: Migrations and Edge Functions (Deno).

### Development Standards

- **Zero-Warning Policy:** Code must pass `npm run check` (Lint, Knip, Typecheck, Coverage, Build).
- **Strict Typing:** No `any` types. Use shared types from `@bluprnt/shared`.
- **Supabase & RLS:** RLS must be enabled on all public tables. Edge functions handle complex logic and AI integrations.
- **Testing:** Maintain high test coverage. Use `vitest` for unit tests and `playwright` for E2E.

### Coding Style & Quality

- **Modularity:** Break down complex tasks into smaller, focused functions and classes.
- **Single Responsibility:** Each unit of code should have a single, well-defined responsibility.
- **No Spaghetti Code:** Avoid deep nesting and tightly coupled logic. Maintain clear separation of concerns.
- **Stability:** Prioritize app stability; never sacrifice correctness for speed. Always validate changes.

### Commands

- `npm run dev`: Start Web.
- `npm run dev:mobile`: Start Mobile.
- `npm run status`: Check monorepo status.
- `npm run check`: Run full quality gate.

## Supabase Integration

- **Project Ref:** `elucgaegaihkklnfoasm`
- **Edge Functions:** Deploy using `supabase functions deploy <name>`.
- **Migrations:** Managed in `supabase/migrations/`. Always use `supabase migration new <name>` for new files.

## AI & Intelligence

- Powered by Gemini 1.5 Pro via Deno Edge Functions.
- Grounding Engine uses regional data for estimates.
- OCR for bulk document ingestion.
