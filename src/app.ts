import express from "express";
import cors from "cors";

import customersRouter from "./routes/customers";
import ordersRouter from "./routes/orders";

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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));


// 2. ดักรับ Error กรณียิงตั๋วปลอม/ตั๋วหมดอายุ (ต้องไว้ถัดจาก jwtAuthen)
app.use((err: any, req: any, res: any, next: any) => {
  if (err.name === "UnauthorizedError") {
    res.status(err.status).json({ message: err.message });
    return;
  }
  next(err);
});
