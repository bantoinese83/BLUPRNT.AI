/**
 * Shared validation rules and constants for both Web and Mobile.
 * Consolidating these prevents logic drift (e.g. different password requirements).
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_VALIDATION_RULES = {
  minLength: PASSWORD_MIN_LENGTH,
  message: `Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`,
} as const;

/**
 * Returns a friendly error message if the password is too short, or null if valid.
 */
export function validatePassword(
  password: string | null | undefined,
): string | null {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return PASSWORD_VALIDATION_RULES.message;
  }
  return null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAIL_PATTERN.test(email.trim());
}

export const ZIP_PATTERN = /^\d{5}$/;

export function isValidZip(zip: string | null | undefined): boolean {
  if (!zip) return false;
  return ZIP_PATTERN.test(zip.trim());
}
