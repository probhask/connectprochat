import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { IUser } from "../../models/user";

const PASSWORD_SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ id: userId }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRATION,
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRATION,
  });
}

/**
 * Strips password/refreshToken before a user document is ever sent to a
 * client. Use only for the CALLER'S OWN account (login/register/self reads)
 * — it still includes email, friends, isVerified, etc., which are fine to
 * hand back to the account owner but not to an arbitrary other viewer.
 */
export function sanitizeUserForResponse(user: IUser) {
  const obj = user.toObject();
  const { password: _password, refreshToken: _refreshToken, ...safe } = obj;
  return safe;
}

/**
 * Public-safe view of a user for when the viewer is NOT the account owner
 * (e.g. GET /api/user/:id). Deliberately narrower than
 * sanitizeUserForResponse — no email, no refreshToken/isVerified internals,
 * no raw friends id list — closing the same over-exposure class the audit
 * flagged for the old unscoped getAllUsers, just at the single-lookup scope.
 */
export function sanitizePublicUserProfile(user: IUser) {
  return {
    _id: user._id,
    username: user.username,
    profile_picture: user.profile_picture,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
  };
}
