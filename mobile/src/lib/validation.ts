/**
 * Lightweight client-side validators used across auth + profile surfaces.
 * Server-side validation remains the source of truth.
 */

import {
  isValidEmail,
  isValidPassword,
  PASSWORD_MIN_LENGTH as MIN_PASSWORD_LENGTH,
} from "@shared/lib/validation";

export { isValidEmail, isValidPassword, MIN_PASSWORD_LENGTH };
