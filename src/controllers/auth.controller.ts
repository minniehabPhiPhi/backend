import type { Request, Response } from "express";
import { secret } from "../config/auth";
import { generateToken } from "../utils/jwt";

export function getTestToken(_req: Request, res: Response) {
  res.status(200).json({ token: generateToken({ username: "Aj.M" }, secret) });
}
