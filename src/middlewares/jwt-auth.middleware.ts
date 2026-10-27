import { expressjwt } from "express-jwt";
import { publicPaths, secret } from "../config/auth";

export const jwtAuthen = expressjwt({
  secret,
  algorithms: ["HS256"],
}).unless({ path: publicPaths });
