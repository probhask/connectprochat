import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { logger } from "../lib/logger";

interface AccessTokenPayload {
  id: string;
}

/**
 * Verifies a socket handshake's access token, mirroring
 * middlewares/verifyJWT.ts's REST equivalent. Now actually reachable —
 * previously this only ran if something called `initSocket`, which nothing
 * did (see sockets/index.ts).
 */
export const verifySocketJWT = async (token: string): Promise<string | null> => {
  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    return decoded?.id ?? null;
  } catch (error) {
    logger.error("Socket JWT verification failed", error);
    return null;
  }
};
