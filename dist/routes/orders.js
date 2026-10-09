"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// 2.1 แสดงรายการสั่งซื้อทั้งหมดพร้อมข้อมูลลูกค้า
// GET /api/orders
router.get("/", async (req, res) => {
    try {
        let sql = `
      SELECT o.order_id, o.quantity, o.order_status, o.created_at,
             c.customer_id, c.first_name, c.last_name, c.phone_number, c.latitude, c.longitude, c.address_detail
      FROM \`orders\` o
      JOIN \`customers\` c ON o.customer_id = c.customer_id
      ORDER BY o.order_id DESC
    `;
        const [rows] = await db_1.conn.query(sql);
        res.status(200).json(rows);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.2 แสดงรายการสั่งซื้อในระยะ 2 กิโลเมตร จากพิกัดที่กำหนด
// GET /api/orders/nearby?lat=16.1832&lng=103.3005&radius=2
router.get("/nearby", async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius || "2");
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Missing required query params: lat, lng" });
        }
        let sql = `
      SELECT o.order_id, o.quantity, o.order_status, o.created_at,
             c.customer_id, c.first_name, c.last_name, c.phone_number, c.latitude, c.longitude, c.address_detail,
             (
               6371 * acos(
                 cos(radians(?)) * cos(radians(c.latitude)) *
                 cos(radians(c.longitude) - radians(?)) +
                 sin(radians(?)) * sin(radians(c.latitude))
               )
             ) AS distance_km
      FROM \`orders\` o
      JOIN \`customers\` c ON o.customer_id = c.customer_id
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
    `;
        const [rows] = await db_1.conn.query(sql, [lat, lng, lat, radius]);
        res.status(200).json(rows);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.3 จำลองออเดอร์ 20-30 รายการ
// POST /api/orders/seed
router.post("/seed", async (req, res) => {
    try {
        const [customers] = await db_1.conn.query("SELECT `customer_id` FROM `customers`");
        if (!customers || customers.length === 0) {
            return res.status(400).json({ error: "No customers found in database" });
        }
        const totalOrders = Math.floor(Math.random() * 11) + 20; // 20 - 30 รายการ
        const values = [];
        for (let i = 0; i < totalOrders; i++) {
            const randomCust = customers[Math.floor(Math.random() * customers.length)].customer_id;
            const randomQty = Math.floor(Math.random() * 3) + 1; // 1 - 3 กล่อง
            values.push([randomQty, "pending", randomCust]);
        }
        let sql = "INSERT INTO `orders`(`quantity`, `order_status`, `customer_id`) VALUES ?";
        const [result] = await db_1.conn.query(sql, [values]);
        const insertResult = result;
        res.status(201).json({
            affected_row: insertResult.affectedRows,
            message: `Successfully seeded ${totalOrders} orders`,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.4 เพิ่มรายการสั่งซื้อใหม่
// POST /api/orders
router.post("/", async (req, res) => {
    try {
        let order = req.body;
        console.log(req.body);
        let sql = "INSERT INTO `orders`(`quantity`, `order_status`, `customer_id`) VALUES (?, ?, ?)";
        const [result] = await db_1.conn.query(sql, [
            order.quantity,
            order.order_status || "pending",
            order.customer_id,
        ]);
        const insertResult = result;
        res.status(201).json({
            affected_row: insertResult.affectedRows,
            last_idx: insertResult.insertId,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.5 แก้ไขจำนวนกล่อง/สถานะ
// PUT /api/orders/:id
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let order = req.body;
        let sql = "UPDATE `orders` SET `quantity`=?, `order_status`=COALESCE(?, `order_status`) WHERE `order_id`=?";
        const [result] = await db_1.conn.query(sql, [order.quantity, order.order_status, id]);
        const updateResult = result;
        res.status(200).json({
            affected_row: updateResult.affectedRows,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.6 ลบรายการสั่งซื้อเฉพาะรายการ
// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let sql = "DELETE FROM `orders` WHERE `order_id`=?";
        const [result] = await db_1.conn.query(sql, [id]);
        const deleteResult = result;
        res.status(200).json({
            affected_row: deleteResult.affectedRows,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 2.7 ล้าง (ลบทั้งหมด) รายการสั่งซื้อ
// DELETE /api/orders
router.delete("/", async (req, res) => {
    try {
        let sql = "DELETE FROM `orders`";
        const [result] = await db_1.conn.query(sql);
        const deleteResult = result;
        res.status(200).json({
            affected_row: deleteResult.affectedRows,
            message: "All orders cleared",
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map