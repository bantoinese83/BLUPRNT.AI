/**
 * Shared document upload constraints for Web, Mobile, and Edge Functions.
 */

/** Max file size in bytes (15MB) */
export const MAX_DOCUMENT_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024;

/** Friendly display string for the limit */
export const MAX_DOCUMENT_UPLOAD_SIZE_LABEL = "15MB";

/** Permitted MIME types for document processing */
export const PERMITTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
