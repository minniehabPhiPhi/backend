import { Router } from "express";
import { fileUpload } from "../config/upload";
import { getFile, uploadFile } from "../controllers/upload.controller";

export const router = Router();
router.post("/", fileUpload.single("file"), uploadFile);
router.get("/:filename", getFile);

export default router;
