import { z } from "zod";
import { UPLOAD_FORM_DOCUMENT_TYPES } from "./infer-document-type.ts";

export const uuidSchema = z.string().uuid();

export const photoToScopeSchema = z.object({
  zip_code: z
    .string()
    .max(20)
    .transform((s) => {
      const digits = s.replace(/\D/g, "").slice(0, 5);
      return digits.length >= 5 ? digits : "00000";
    }),
  room_type: z.string().transform((s) => {
    const v = s.toLowerCase();
    if (v === "kitchen") return "kitchen" as const;
    if (v === "bathroom" || v === "bath") return "bathroom" as const;
    return "other" as const;
  }),
  finish_preference: z.string().transform((s) => {
    const v = s.toLowerCase();
    return (v === "economy" || v === "premium" ? v : "mid") as
      | "economy"
      | "mid"
      | "premium";
  }),
  project_id: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      const s = (v ?? "").trim();
      if (!s) return null;
      const parsed = uuidSchema.safeParse(s);
      return parsed.success ? parsed.data : null;
    }),
  location_unset: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  scope_description: z.string().max(2000).optional().nullable(),
});

export const documentTypeSchema = z.preprocess(
  (v) => {
    const s = String(v ?? "")
      .trim()
      .toLowerCase();
    if ((UPLOAD_FORM_DOCUMENT_TYPES as readonly string[]).includes(s)) {
      return s;
    }
    return "auto";
  },
  z.enum(
    UPLOAD_FORM_DOCUMENT_TYPES as unknown as [
      (typeof UPLOAD_FORM_DOCUMENT_TYPES)[number],
      ...(typeof UPLOAD_FORM_DOCUMENT_TYPES)[number][],
    ],
  ),
);

/** iOS camera/library often produces HEIC; mobile multipart may omit `File.type`. */
export const UPLOAD_MIME_ALLOWLIST = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function uploadFileMimeLooksAllowed(
  type?: string,
  name?: string,
): boolean {
  const t = (type || "").trim().toLowerCase();
  if (t && UPLOAD_MIME_ALLOWLIST.has(t)) return true;
  // React Native / some clients send an empty type — infer from filename.
  if (!t || t === "application/octet-stream") {
    const n = (name || "").toLowerCase();
    return /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(n);
  }
  return false;
}

export const uploadLedgerEntrySchema = z.object({
  project_id: uuidSchema,
  // File validation is handled differently in backend vs frontend (multipart/form-data vs browser File)
  // so we keep the structural fields here.
  document_type: documentTypeSchema,
  vendor_hint: z.string().max(200).optional().nullable(),
  amount_hint: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v == null) return null;
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : null;
    }),
});

export const getLedgerEntrySchema = z.object({
  ledger_entry_id: uuidSchema,
});

/** Public lead capture (inserted via Edge Function with service role). */
export const marketingLeadSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  source: z.string().trim().min(1).max(64),
});

/** Max prior turns accepted by `chatWithProjectSchema` (each user + assistant counts as one entry). */
export const CHAT_WITH_PROJECT_HISTORY_MAX = 24;

/** One prior turn for `chat-with-project` (client sends full transcript minus the latest user message). */
export const chatProjectHistoryEntrySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

/** AI chat: bounded prompt + project scope + optional conversation memory. */
export const chatWithProjectSchema = z.object({
  projectId: uuidSchema,
  query: z.string().trim().min(1).max(8000),
  history: z
    .array(chatProjectHistoryEntrySchema)
    .max(CHAT_WITH_PROJECT_HISTORY_MAX)
    .optional(),
});

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

export function isValidPassword(password: string | null | undefined): boolean {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH;
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
