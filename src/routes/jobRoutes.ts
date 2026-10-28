import { Router } from "express";
import { clearJobs, getJobByCode, getJobs, replaceJobs } from "../controllers/jobController";

export const router = Router();

router.get("/", getJobs);
router.get("/:code", getJobByCode);
router.put("/", replaceJobs);
router.delete("/", clearJobs);
