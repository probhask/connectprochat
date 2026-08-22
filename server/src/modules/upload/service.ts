import fs from "fs";
import path from "path";

import { TxContext } from "../../lib/services/factory/tx-context";
import { ApiError } from "../../lib/api-error";
import { IMessage } from "../../models/message";
import { IUpload } from "../../models/upload";
import { deleteMedia } from "../../utils/deleteMedia";
import { assertIsParticipant } from "../conversation/service";
import * as userService from "../user/service";

const SENDER_POPULATE = {
  path: "sender",
  select: "username _id profile_picture",
  populate: { path: "profile_picture", model: "Upload", select: "path _id mimetype originalName fileName fullPath" },
};
const MEDIA_POPULATE = {
  path: "media",
  select: "path _id mimetype originalName fileName fullPath",
};

const UPLOAD_DIR = path.resolve(__dirname, "../../upload");

/** Persists a Multer-saved file's metadata as an Upload document. */
export async function saveUploadedFile(tx: TxContext, file: Express.Multer.File) {
  return tx.upload.create({
    originalName: file.originalname,
    fileName: file.filename,
    path: `/upload/${file.filename}`,
    fullPath: file.path,
    mimetype: file.mimetype,
    size: file.size,
  } as unknown as Partial<IUpload>);
}

/**
 * Uploads a file and attaches it to a new message in `conversationId`.
 * Sender is always the caller (req.userId) — the pre-revamp version took
 * `sender` from the request body. Requires the caller to already be a
 * conversation participant (reuses the conversation module's own check
 * rather than duplicating the membership rule here).
 */
export async function uploadMessageFile(
  tx: TxContext,
  file: Express.Multer.File,
  senderId: string,
  conversationId: string,
  text: string
) {
  await assertIsParticipant(tx, conversationId, senderId);

  const savedUpload = await saveUploadedFile(tx, file);
  const message = await tx.message.create({
    conversationId,
    sender: senderId,
    text,
    media: savedUpload._id,
  } as unknown as Partial<IMessage>);

  return tx.message.findOne(
    { _id: message._id },
    { populate: [SENDER_POPULATE, MEDIA_POPULATE] }
  );
}

/**
 * Replaces the caller's own profile picture, deleting the old one (disk
 * file + Upload doc) if present. `userId` is always req.userId — the
 * pre-revamp version took it from the request body. Composes into
 * user/service.ts rather than writing the User document directly here.
 */
export async function uploadProfilePicture(
  tx: TxContext,
  file: Express.Multer.File,
  userId: string
) {
  const user = await userService.findUserById(tx, userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.profile_picture) {
    const oldMedia = await tx.upload.findOne({ _id: user.profile_picture });
    if (oldMedia) deleteMedia(oldMedia);
    await tx.upload.deleteOne({ _id: user.profile_picture });
  }

  const savedUpload = await saveUploadedFile(tx, file);
  const updatedUser = await userService.setProfilePicture(
    tx,
    userId,
    savedUpload._id.toString()
  );
  return updatedUser.profile_picture;
}

/**
 * Resolves a requested filename to a path inside the upload directory,
 * rejecting anything that would escape it. Fixes a path-traversal bug found
 * while migrating this module: the pre-revamp downLoadFile built
 * `path.join(__dirname, "../upload", filename)` directly from
 * `req.params.filename` with no sanitization — a filename like
 * `../../../../etc/passwd` would resolve outside the upload directory
 * entirely and let an authenticated user download arbitrary server files.
 */
export function resolveSafeDownloadPath(filename: string): string {
  // path.basename strips any directory components (../, /, etc.) — the
  // resolved path can then only ever land inside UPLOAD_DIR.
  const safeName = path.basename(filename);
  const resolved = path.join(UPLOAD_DIR, safeName);

  if (path.dirname(resolved) !== UPLOAD_DIR || !fs.existsSync(resolved)) {
    throw new ApiError(404, "File not found");
  }
  return resolved;
}
