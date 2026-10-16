import express from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export const router = express.Router();

// โฟลเดอร์เก็บไฟล์อัปโหลด (อยู่ root/uploads)
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskLoader = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (_req, file, cb) => {
            const ext = file.originalname.split(".").pop();
            cb(null, `${uuidv4()}.${ext}`);
        },
    }),
    limits: {
        fileSize: 67108864, // ไม่เกิน 64 MB
    },
});

// อัปโหลดไฟล์เดี่ยว field ชื่อ "file"
router.post("/", diskLoader.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filename: req.file.filename });
});

// ดึงไฟล์กลับ / ดาวน์โหลด
router.get("/:filename", (req, res) => {
    const filename = req.params.filename;
    const download = req.query.download || undefined;

    if (download === "true") {
        res.download(path.join(uploadsDir, filename));
    } else {
        res.sendFile(path.join(uploadsDir, filename));
    }
});
