"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db"); // ปรับตามชื่อไฟล์ db ของคุณ (เช่น ../db หรือ ../dbconnect)
const router = (0, express_1.Router)();
// 1.1 แสดงข้อมูลลูกค้าทั้งหมด หรือ ค้นหาจากชื่อ/นามสกุล
// GET /api/customers?search=สม
router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let sql = "SELECT * FROM `customers`";
        const params = [];
        if (search) {
            sql += " WHERE `first_name` LIKE ? OR `last_name` LIKE ?";
            params.push(`%${search}%`, `%${search}%`);
        }
        const [rows] = await db_1.conn.query(sql, params);
        res.status(200).json(rows);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 1.2 ค้นหาลูกค้าในระยะ 1 กิโลเมตร จากพิกัด lat, lng ที่กำหนด
// GET /api/customers/nearby?lat=16.1832&lng=103.3005&radius=1
router.get("/nearby", async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius || "1");
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Missing required query params: lat, lng" });
        }
        let sql = `
      SELECT *, (
        6371 * acos(
          cos(radians(?)) * cos(radians(\`latitude\`)) *
          cos(radians(\`longitude\`) - radians(?)) +
          sin(radians(?)) * sin(radians(\`latitude\`))
        )
      ) AS distance_km
      FROM \`customers\`
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
// 1.3 เพิ่มข้อมูลลูกค้าใหม่
// POST /api/customers
router.post("/", async (req, res) => {
    try {
        let customer = req.body;
        console.log(req.body);
        let sql = "INSERT INTO `customers`(`first_name`, `last_name`, `phone_number`, `latitude`, `longitude`, `address_detail`) VALUES (?,?,?,?,?,?)";
        const [result] = await db_1.conn.query(sql, [
            customer.first_name,
            customer.last_name,
            customer.phone_number,
            customer.latitude,
            customer.longitude,
            customer.address_detail,
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
// 1.4 แก้ไขข้อมูลลูกค้า
// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let customer = req.body;
        let sql = "UPDATE `customers` SET `first_name`=?, `last_name`=?, `phone_number`=?, `latitude`=?, `longitude`=?, `address_detail`=? WHERE `customer_id`=?";
        const [result] = await db_1.conn.query(sql, [
            customer.first_name,
            customer.last_name,
            customer.phone_number,
            customer.latitude,
            customer.longitude,
            customer.address_detail,
            id,
        ]);
        const updateResult = result;
        res.status(200).json({
            affected_row: updateResult.affectedRows,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
// 1.5 ลบข้อมูลลูกค้า
// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let sql = "DELETE FROM `customers` WHERE `customer_id`=?";
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
exports.default = router;
//# sourceMappingURL=customers.js.map