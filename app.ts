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
