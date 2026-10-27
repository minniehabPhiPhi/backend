import express, { Router } from "express";
import { uploadsDirectory } from "../config/upload";
import authRouter from "./auth";
import customersRouter from "./customers";
import ordersRouter from "./orders";
import uploadRouter from "./upload";

const router = Router();
router.use("/api/customers", customersRouter);
router.use("/api/orders", ordersRouter);
router.use("/upload", uploadRouter);
router.use("/uploads", express.static(uploadsDirectory));
router.use(authRouter);

export default router;
