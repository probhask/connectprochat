import { Request } from "express";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { randomUUID } from "crypto";

import { ApiError } from "../../lib/api-error";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "./constants";

const uploadDir = path.resolve(__dirname, "../../upload");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
    cb(null, true);
  } else {
    // ApiError extends Error, so it satisfies Multer's fileFilter callback —
    // and lib/error-handler.ts maps it straight to a clean 400 instead of
    // a generic 500.
    cb(new ApiError(400, "Unsupported file format"));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});
