import express from "express";
import cors from "cors";
import path from "path";
import customersRouter from "./routes/customers";
import ordersRouter from "./routes/orders";
import uploadRouter from "./routes/upload";
import { generateToken, jwtAuthen, secret } from "./jwtauth";

const app = express();
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // ระบุโดเมนเว็บหน้าบ้านตรงนี้
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../test")));
app.use("/api/customers", customersRouter);
app.use("/api/orders", ordersRouter)
app.use("/upload", uploadRouter);
app.use("/uploads", express.static("uploads"));
const PORT = 3000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "https://your-production-frontend.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // เช็กหากว่าไม่มี origin (ยิงผ่าน Postman หรือเบื้องหลัง) หรือโดเมนตรงกับ whitelist
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(jwtAuthen);

// 2. ดักรับ Error กรณียิงตั๋วปลอม/ตั๋วหมดอายุ (ต้องไว้ถัดจาก jwtAuthen)
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    res.status(err.status).json({ message: err.message });
    return;
  }
  next(err);
});

// 3. สร้างเส้นทางสำหรับรับตั๋วทดสอบ
app.use("/testtoken", (req, res) => {
  const payload = { username: "Aj.M" }; 
  const jwttoken = generateToken(payload, secret);
  res.status(200).json({
    token: jwttoken,
  });
});

// 3. กำหนดให้ Root Path ("/") เปิดไฟล์ index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../test/index.html"));
});