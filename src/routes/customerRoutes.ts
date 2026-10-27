import { Router } from "express";
import {
    createCustomer,
    deleteCustomerByID,
    getCustomers,
    getCustomersByID,
    getNearbyCustomers,
    updateCustomerByID,
} from "../controllers/customerController";

export const router = Router();

// หมายเหตุ: ต้องวาง /nearby ก่อน /:id ไม่งั้น "nearby" จะโดนจับเป็น id
router.get("/", getCustomers);
router.get("/nearby", getNearbyCustomers);
router.get("/:id", getCustomersByID);
router.post("/", createCustomer);
router.put("/:id", updateCustomerByID);
router.delete("/:id", deleteCustomerByID);
