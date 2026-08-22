/**
 * Fix for the audit's Multer finding: the pre-revamp config set
 * `limits: { files: 1024 * 1024 * 5 }` — `files` caps file *count*, not
 * size (so there was no real size limit at all), and `fileFilter` was
 * defined but commented out and itself buggy (checked `file.type`, which
 * doesn't exist on Multer's File — should be `file.mimetype`).
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
] as const;
