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

/** Strips password/refreshToken before a user document is ever sent to a client. */
export function sanitizeUserForResponse(user: IUser) {
  const obj = user.toObject();
  const { password: _password, refreshToken: _refreshToken, ...safe } = obj;
  return safe;
}
