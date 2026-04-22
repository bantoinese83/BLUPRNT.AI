/**
 * Lightweight client-side validators used across auth + profile surfaces.
 * Server-side validation remains the source of truth.
 */

/** Simple, tolerant RFC-5322-ish email check (no catastrophic backtracking). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/** Minimum password length we enforce on the client before hitting Supabase. */
export const MIN_PASSWORD_LENGTH = 8;

export function isValidPassword(value: string): boolean {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}
