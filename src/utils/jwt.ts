import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { tokenOptions } from "../config/auth";

export function generateToken(payload: object, secretKey: string): string {
  return jwt.sign(payload, secretKey, tokenOptions);
}

export function verifyToken(
  token: string,
  secretKey: string,
): { valid: boolean; decoded?: string | JwtPayload; error?: string } {
  try {
    return { valid: true, decoded: jwt.verify(token, secretKey) };
  } catch (error) {
    return { valid: false, error: JSON.stringify(error) ?? "Invalid token" };
  }
}
