import Upload, { IUpload } from "../models/upload";

import fs from "fs";
import { logger } from "../lib/logger";
import path from "path";

export const deleteMedia = (dbMedia: IUpload) => {
  if (dbMedia) {
    const mediaPath = path.join(__dirname, "..", "upload", dbMedia?.fileName);

    try {
      //check if the file exist then delete it
      fs.unlink(mediaPath, (err) => {
        if (err && err.code !== "ENOENT") {
          logger.error(`Error deleting media file: ${mediaPath}`, err);
        } else {
          logger.debug(`Deleted media file: ${mediaPath}`);
        }
      });
    } catch (error) {
      logger.error(`Failed to delete media file: ${mediaPath}`, error);
      return false;
    }
    return true;
  } else {
    return false;
  }
};
