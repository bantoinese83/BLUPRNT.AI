import { z } from "https://esm.sh/zod@3.23.8";

const uuidSchema = z.string().uuid();

export const photoToScopeSchema = z.object({
  zip_code: z.string().max(20).transform((s) => {
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
    return (v === "economy" || v === "premium" ? v : "mid") as "economy" | "mid" | "premium";
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

const documentTypeSchema = z.enum(["invoice", "quote", "warranty", "permit"]).default("invoice");

export const uploadInvoiceSchema = z.object({
  project_id: uuidSchema,
  file: z
    .custom<File>((v) => v instanceof File && v.size > 0, "Valid file required")
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be under 10MB"),
  document_type: documentTypeSchema,
  vendor_hint: z.string().max(200).optional().nullable(),
  amount_hint: z.union([z.string(), z.number()]).optional().transform((v) => {
    if (v === "" || v == null) return null;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
  }),
});

export const getInvoiceSchema = z.object({
  invoice_id: uuidSchema,
});
