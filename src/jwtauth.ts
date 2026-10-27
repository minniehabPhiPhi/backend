// Compatibility exports for existing imports.
export { secret } from "./config/auth";
export { jwtAuthen } from "./middlewares/jwt-auth.middleware";
export { generateToken, verifyToken } from "./utils/jwt";
