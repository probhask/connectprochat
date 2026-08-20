import { Router } from "express";

import { sendEmailOtp, verifyEmailOtp } from "./controllers";

const router = Router();

router.post("/email/send", sendEmailOtp);
router.post("/email/verify", verifyEmailOtp);

export default router;
