import type { Request, Response } from "express";
import { uploadsDirectory } from "../config/upload";

export function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  res.json({ filename: req.file.filename });
}

export function getFile(req: Request<{ filename: string }>, res: Response) {
  const filename = req.params.filename;
  if (filename.includes("/") || filename.includes("\\") || filename === "." || filename === "..") {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  if (req.query.download === "true") {
    res.download(filename, filename, { root: uploadsDirectory });
  } else {
    res.sendFile(filename, { root: uploadsDirectory });
  }
}
