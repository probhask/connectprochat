import { Router } from "express";

import verifyJWT from "../../middlewares/verifyJWT";
import { downloadFile, uploadMessageFile, uploadProfilePicture, viewFile } from "./controllers";
import { upload } from "./multer.config";

const router = Router();
router.use(verifyJWT);

router.post("/message", upload.single("file"), uploadMessageFile);
router.post("/profile-pic", upload.single("file"), uploadProfilePicture);

export default router;

/** Mounted separately at /api/download — see app.ts. */
export const downloadRouter = Router();
downloadRouter.get("/:filename", verifyJWT, downloadFile);

/**
 * Mounted separately at /api/file — see app.ts. Deliberately NOT behind
 * verifyJWT (see viewFile's doc comment in controllers.ts for why that's
 * safe here, unlike the express.static bug this replaced).
 */
export const viewRouter = Router();
viewRouter.get("/:filename", viewFile);
