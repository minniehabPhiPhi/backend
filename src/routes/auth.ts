import { Router } from "express";
import { getTestToken } from "../controllers/auth.controller";

const router = Router();
router.use("/testtoken", getTestToken);

export default router;
