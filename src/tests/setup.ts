import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const uploadDirectory = mkdtempSync(path.join(os.tmpdir(), "mvc-api-"));
process.env.UPLOAD_DIR = uploadDirectory;
process.env.JWT_SECRET = "mvc-api-test-secret";
process.env.CORS_ORIGINS = "http://localhost:4200";
