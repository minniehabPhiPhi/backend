import { Router } from "express";
import {
  createCustomer, deleteCustomer, getCustomers, getNearbyCustomers, updateCustomer,
} from "../controllers/customer.controller";

export type { CustomerPostRequest } from "../models/customer.model";

const router = Router();
router.get("/", getCustomers);
router.get("/nearby", getNearbyCustomers);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
