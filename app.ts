import express from "express";
import cors from "cors";
import path from "path";
import { router as customerRoutes } from "./src/routes/customerRoutes";
import { router as orderRoutes } from "./src/routes/orderRoutes";
import { router as uploadRoutes } from "./src/routes/uploadRoutes";
import { generateToken, jwtAuthen, secret } from "./src/config/jwtauth";

export const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// แจกไฟล์อัปโหลด
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// เส้นสำหรับขอ token ทดสอบ (ไม่ต้องแนบ token)
app.use("/testtoken", (_req, res) => {
    const payload = { username: "Aj.M" };
    const jwttoken = generateToken(payload, secret);
    res.status(200).json({ token: jwttoken });
});

// ตรวจ token ก่อนเข้า API หลัก
app.use(jwtAuthen);

// ดัก error กรณี token ปลอม / หมดอายุ
app.use((err: any, _req: any, res: any, next: any) => {
    if (err.name === "UnauthorizedError") {
        res.status(err.status || 401).json({ message: err.message });
        return;
    }
    next(err);
});

app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/upload", uploadRoutes);

app.get("/", (_req, res) => {
    res.json({ message: "Lunch Delivery API running" });
});

export default app;
