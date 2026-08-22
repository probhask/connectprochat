import fs from "fs";

import { asyncWrapper } from "../../lib/async-wrapper";
import { ApiError } from "../../lib/api-error";
import { logger } from "../../lib/logger";
import { successResponse } from "../../lib/response-handlers";
import { runTransaction } from "../../lib/transaction";
import { SDownloadFileParams, SUploadMessageFile } from "./schemas";
import * as uploadService from "./service";

/**
 * Multer's upload.single("file") middleware writes the file to disk BEFORE
 * the controller runs, so any failure past that point (e.g. the caller
 * isn't a conversation participant) leaves an orphaned file with nothing
 * ever referencing it — no cleanup path, silently accumulating storage.
 * Every upload controller runs its DB work through this so a failure
 * deletes the just-written file instead of abandoning it.
 */
async function withUploadCleanup<T>(
  file: Express.Multer.File,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    fs.unlink(file.path, (err) => {
      if (err) logger.error(`Failed to clean up orphaned upload ${file.path}`, err);
    });
    throw error;
  }
}

/**
 * Uploads a file and attaches it as media on a new message. Sender is
 * always the caller.
 * @route POST /api/upload/message
 * @body SUploadMessageFile — { conversationId, text? } (multipart, field "file")
 * @auth required — verifyJWT
 */
export const uploadMessageFile = asyncWrapper(
  async (req, res, { body }) => {
    if (!req.file) throw new ApiError(400, "No file uploaded");
    const file = req.file;
    const senderId = req.userId!;
    const message = await withUploadCleanup(file, () =>
      runTransaction((tx) =>
        uploadService.uploadMessageFile(tx, file, senderId, body.conversationId, body.text ?? "")
      )
    );
    return successResponse(res, { status: 201, data: message });
  },
  { body: SUploadMessageFile }
);

/**
 * Uploads and sets the caller's own profile picture, replacing any existing
 * one.
 * @route POST /api/upload/profile-pic
 * @auth required — verifyJWT (multipart, field "file")
 */
export const uploadProfilePicture = asyncWrapper(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");
  const file = req.file;
  const userId = req.userId!;
  const profilePicture = await withUploadCleanup(file, () =>
    runTransaction((tx) => uploadService.uploadProfilePicture(tx, file, userId))
  );
  return successResponse(res, { status: 201, data: profilePicture });
});

/**
 * Downloads a previously uploaded file by name, as an attachment (forces
 * "Save As"). This is for an explicit user-initiated download action.
 * @route GET /api/download/:filename
 * @params SDownloadFileParams — { filename }
 * @auth required — verifyJWT
 */
export const downloadFile = asyncWrapper(
  async (req, res, { params }) => {
    const filePath = uploadService.resolveSafeDownloadPath(params.filename);
    res.download(filePath);
  },
  { params: SDownloadFileParams }
);

/**
 * Serves a previously uploaded file inline by name (for <img>/<video> src —
 * a plain browser media tag can't attach the Authorization header
 * /api/download requires, so it can't be used for passive display).
 * Deliberately unauthenticated, same trade-off as an object-storage bucket
 * with random keys and no signed URLs: `filename` is a server-generated
 * UUID (see multer.config.ts), not guessable or enumerable, and
 * resolveSafeDownloadPath still blocks path traversal / access outside the
 * upload directory — it does NOT reintroduce the removed express.static
 * bug (that exposed the whole directory listing to anyone with zero
 * knowledge of any filename). Anyone who already has a specific filename
 * (e.g. from a conversation they're a legitimate participant in) can view
 * it without re-authenticating; that's an accepted trade-off for this app,
 * not a suitable pattern for content requiring per-request authorization.
 * @route GET /api/file/:filename
 * @params SDownloadFileParams — { filename }
 * @auth none (see above)
 */
export const viewFile = asyncWrapper(
  async (req, res, { params }) => {
    const filePath = uploadService.resolveSafeDownloadPath(params.filename);
    res.sendFile(filePath);
  },
  { params: SDownloadFileParams }
);
