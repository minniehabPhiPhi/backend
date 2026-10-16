import express from "express";
import cors from "cors";

import customersRouter from "./routes/customers";
import ordersRouter from "./routes/orders";
import uploadRouter from "./routes/upload";
import { generateToken, jwtAuthen, secret } from "./jwtauth";

const app = express();
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/upload', uploadRouter);
app.use('/uploads', express.static('uploads'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));

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