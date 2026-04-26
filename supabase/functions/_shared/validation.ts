import { z } from "https://esm.sh/zod@3.23.8";
import { 
  photoToScopeSchema as _p, 
  uploadInvoiceSchema as _u, 
  marketingLeadSchema as _m, 
  chatWithProjectSchema as _c,
  getInvoiceSchema as _g,
  uploadFileMimeLooksAllowed as _mime,
  uuidSchema as _uuid,
  documentTypeSchema as _dt
} from "../../../shared/lib/validation.ts";

// Proxy re-exports to maintain compatibility with existing Edge Function imports
// but enforcing the shared logic from @bluprnt/shared.

export const photoToScopeSchema = _p;
export const uploadInvoiceSchema = _u.extend({
  // Backend needs the raw File object validation which is environment specific
  file: z
    .custom<File>((v) => v instanceof File && v.size > 0, "Valid file required")
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be under 10MB")
    .refine(
      (f) => _mime(f.type, f.name),
      "Unsupported file type. Upload a PDF, JPEG, PNG, WEBP, or HEIC.",
    ),
});
export const marketingLeadSchema = _m;
export const chatWithProjectSchema = _c;
export const getInvoiceSchema = _g;
export const uuidSchema = _uuid;
export const documentTypeSchema = _dt;
