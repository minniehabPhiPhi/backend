import { Router } from "express";
import {
    clearOrders,
    createOrder,
    deleteOrderByID,
    getNearbyOrders,
    getOrder,
    getOrderByID,
    seedOrders,
    updateOrderByID,
} from "../controllers/orderController";

export const router = Router();

router.get("/", getOrder);
router.get("/nearby", getNearbyOrders);
router.get("/:id", getOrderByID);
router.post("/", createOrder);
router.post("/seed", seedOrders);
router.put("/:id", updateOrderByID);
router.delete("/", clearOrders);
router.delete("/:id", deleteOrderByID);
