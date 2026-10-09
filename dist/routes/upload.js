"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
exports.router = express_1.default.Router();
class FileMiddleware {
    constructor() {
        const uploadsDir = path_1.default.join(__dirname, "../uploads");
        if (!fs_1.default.existsSync(uploadsDir)) {
            // สร้างโฟลเดอร์สำหรับอัปโหลดอัตโนมัติหากยังไม่มีอยู่
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        }
    }
    diskLoader = (0, multer_1.default)({
        storage: multer_1.default.diskStorage({
            // กำหนดปลายทางเก็บไฟล์
            destination: (_req, _file, cb) => {
                cb(null, path_1.default.join(__dirname, "../uploads"));
            },
            // กำหนดชื่อไฟล์ใหม่ให้ไม่ซ้ำโดยใช้ UUID ร่วมกับนามสกุลไฟล์เดิม
            filename: (_req, file, cb) => {
                const uniqueSuffix = (0, uuid_1.v4)();
                const ext = file.originalname.split(".").pop();
                cb(null, `${uniqueSuffix}.${ext}`);
            },
        }),
        limits: {
            fileSize: 67108864, // จำกัดขนาดไฟล์ไม่เกิน 64 MByte
        },
    });
}
const fileUpload = new FileMiddleware();
// เส้นอัปโหลดไฟล์เดี่ยว
exports.router.post("/", fileUpload.diskLoader.single("file"), (req, res) => {
    // ดึงชื่อไฟล์จาก req.file.filename (ระวังอย่าเก็บชื่อไฟล์ไว้ในตัวแปรคลาส เพราะอาจจะเกิด Race Condition สลับชื่อไฟล์หากมีการอัปโหลดพร้อมกันหลายคน!)
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ filename: req.file.filename });
});
// เส้นทางดึงไฟล์หรือดาวน์โหลดไฟล์กลับ
exports.router.get("/:filename", (req, res) => {
    const filename = req.params.filename;
    const download = req.query.download || undefined;
    if (download === "true") {
        // บังคับให้ดาวน์โหลดลงเครื่อง
        res.download(path_1.default.join(__dirname, "../uploads", filename));
    }
    else {
        // แสดงผลไฟล์บนเบราว์เซอร์ปกติ (เช่น แสดงรูปภาพ)
        res.sendFile(path_1.default.join(__dirname, "../uploads", filename));
    }
});
exports.default = exports.router;
//# sourceMappingURL=upload.js.map