import "@testing-library/jest-dom/vitest";

/** Allow importing `supabase` client in tests when `.env` is absent (e.g. CI). */
process.env.VITE_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.VITE_SUPABASE_ANON_KEY ??= "vitest-anon-key-placeholder";
