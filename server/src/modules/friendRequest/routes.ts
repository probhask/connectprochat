import { Router } from "express";

import verifyJWT from "../../middlewares/verifyJWT";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriendRequests,
  sendFriendRequest,
} from "./controllers";

const router = Router();
router.use(verifyJWT);

router.get("/", listFriendRequests);
router.post("/send", sendFriendRequest);
router.put("/", acceptFriendRequest);
router.delete("/", cancelFriendRequest);

export default router;
