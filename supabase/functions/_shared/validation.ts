import { z } from "zod";
import {
  photoToScopeSchema as _p,
  uploadLedgerEntrySchema as _u,
  marketingLeadSchema as _m,
  chatWithProjectSchema as _c,
  getLedgerEntrySchema as _g,
  uploadFileMimeLooksAllowed as _mime,
  uuidSchema as _uuid,
  documentTypeSchema as _dt,
  authEmailFieldSchema as _authEmail,
  authLoginPasswordFieldSchema as _authLoginPassword,
  authRegisterPasswordFieldSchema as _authRegisterPassword,
  authZipFieldSchema as _authZip,
  authAcceptedPoliciesFieldSchema as _authPolicies,
  loginPasswordFormSchema as _loginPassword,
  loginMagicFormSchema as _loginMagic,
  registerPasswordFormSchema as _registerPassword,
  registerMagicFormSchema as _registerMagic,
  forgotPasswordFormSchema as _forgotPassword,
  marketingLeadFormSchema as _marketingLeadForm,
  mobileRegisterFormSchema as _mobileRegister,
  resetPasswordFormSchema as _resetPassword,
} from "../../../shared/lib/validation.ts";

// Proxy re-exports to maintain compatibility with existing Edge Function imports
// but enforcing the shared logic from @bluprnt/shared.

export const photoToScopeSchema = _p;
export const uploadLedgerEntrySchema = _u.extend({
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
export const getLedgerEntrySchema = _g;
export const uuidSchema = _uuid;
export const documentTypeSchema = _dt;

/** Auth / registration payloads (Supabase Auth is primary; shared for parity + future edge routes). */
export const authEmailFieldSchema = _authEmail;
export const authLoginPasswordFieldSchema = _authLoginPassword;
export const authRegisterPasswordFieldSchema = _authRegisterPassword;
export const authZipFieldSchema = _authZip;
export const authAcceptedPoliciesFieldSchema = _authPolicies;
export const loginPasswordFormSchema = _loginPassword;
export const loginMagicFormSchema = _loginMagic;
export const registerPasswordFormSchema = _registerPassword;
export const registerMagicFormSchema = _registerMagic;
export const forgotPasswordFormSchema = _forgotPassword;
export const marketingLeadFormSchema = _marketingLeadForm;
export const mobileRegisterFormSchema = _mobileRegister;
export const resetPasswordFormSchema = _resetPassword;
