import type { SignOptions } from "jsonwebtoken";
import { env } from "./env";

export const secret = env.jwtSecret;
export const tokenOptions: SignOptions = {
  expiresIn: "30d",
  issuer: "CS-MSU",
};
export const publicPaths = ["/", "/register", "/login", "/testtoken"];
