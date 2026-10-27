import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "./env";

export const uploadsDirectory = env.uploadDirectory;
export const fileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      try {
        mkdirSync(uploadsDirectory, { recursive: true });
        callback(null, uploadsDirectory);
      } catch (error) {
        callback(error as Error, uploadsDirectory);
      }
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: env.maxUploadSize },
});
