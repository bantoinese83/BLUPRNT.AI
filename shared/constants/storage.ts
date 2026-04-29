/**
 * Configuration for Supabase Storage and file handling.
 */
export const STORAGE_CONFIG = {
  /** Expiry time for signed URLs in seconds (1 hour) */
  SIGNED_URL_EXPIRY: 3600,

  /** Maximum file size for gallery photos (5MB) */
  MAX_GALLERY_FILE_SIZE_MB: 5,
} as const;
