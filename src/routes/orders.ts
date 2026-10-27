import { Router } from "express";
import {
  clearOrders, createOrder, deleteOrder, getNearbyOrders, getOrders, seedOrders, updateOrder,
} from "../controllers/order.controller";

export type { OrderPostRequest } from "../models/order.model";

const router = Router();
router.get("/", getOrders);
router.get("/nearby", getNearbyOrders);
router.post("/seed", seedOrders);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);
router.delete("/", clearOrders);

export default router;
