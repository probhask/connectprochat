import { Router } from "express";

import verifyJWT from "../../middlewares/verifyJWT";
import { downloadFile, uploadMessageFile, uploadProfilePicture } from "./controllers";
import { upload } from "./multer.config";

const router = Router();
router.use(verifyJWT);

router.post("/message", upload.single("file"), uploadMessageFile);
router.post("/profile-pic", upload.single("file"), uploadProfilePicture);

export default router;

/** Mounted separately at /api/download — see app.ts. */
export const downloadRouter = Router();
downloadRouter.get("/:filename", verifyJWT, downloadFile);
