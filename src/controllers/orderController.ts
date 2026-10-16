import { Request, Response } from "express";
import { conn } from "../config/dbconnect";
import { PoolConnection } from "mysql2/promise";

const ALLOWED_STATUS = ["pending", "delivered", "cancelled"];

// 2.1 ดูออเดอร์ทั้งหมดพร้อมข้อมูลลูกค้า
// GET /api/orders
export const getOrder = async (_req: Request, res: Response) => {
    try {
        const sql = `
            SELECT o.order_id, o.quantity, o.order_status, o.created_at,
                   c.customer_id, c.first_name, c.last_name, c.phone_number, c.latitude, c.longitude, c.address_detail
            FROM \`orders\` o
            JOIN \`customers\` c ON o.customer_id = c.customer_id
            ORDER BY o.order_id DESC
        `;
        const [rows] = await conn.query(sql);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// ดูออเดอร์รายการเดียว
// GET /api/orders/:id
export const getOrderByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT o.order_id, o.quantity, o.order_status, o.created_at,
                   c.customer_id, c.first_name, c.last_name, c.phone_number, c.latitude, c.longitude, c.address_detail
            FROM \`orders\` o
            JOIN \`customers\` c ON o.customer_id = c.customer_id
            WHERE o.order_id = ?
        `;
        const [rows] = await conn.query(sql, [id]);
        const list = rows as any[];
        if (list.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json(list[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2.2 หาออเดอร์ในรัศมีรอบพิกัด (ดีฟอลต์ 2 กม.)
// GET /api/orders/nearby?lat=16.24&lng=103.25&radius=2
export const getNearbyOrders = async (req: Request, res: Response) => {
    try {
        const latRaw = (req.query.lat ?? req.query.latitude) as string | undefined;
        const lngRaw = (req.query.lng ?? req.query.longitude) as string | undefined;
        const lat = parseFloat(latRaw || "");
        const lng = parseFloat(lngRaw || "");
        const radius = parseFloat((req.query.radius as string) || "2");

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Missing required query params: lat, lng" });
        }

        const sql = `
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

        const [rows] = await conn.query(sql, [lat, lng, lat, radius]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2.3 สุ่มออเดอร์ 20-30 รายการ (ส่ง amount มาด้วยก็ได้)
// POST /api/orders/seed
export const seedOrders = async (req: Request, res: Response) => {
    let connection: PoolConnection | undefined;
    try {
        let amount: number;
        if (req.body && req.body.amount !== undefined) {
            amount = Number(req.body.amount);
            if (!Number.isInteger(amount) || amount < 20 || amount > 30) {
                return res.status(400).json({ error: "Amount must be between 20 and 30" });
            }
        } else {
            amount = Math.floor(Math.random() * 11) + 20; // 20-30
        }

        connection = await conn.getConnection();
        const [customers]: any = await connection.query("SELECT `customer_id` FROM `customers`");
        if (!customers || customers.length === 0) {
            return res.status(400).json({ error: "No customers found in database" });
        }

        const values: any[] = [];
        for (let i = 0; i < amount; i++) {
            const randomCust = customers[Math.floor(Math.random() * customers.length)].customer_id;
            const randomQty = Math.floor(Math.random() * 3) + 1; // 1-3 กล่อง
            values.push([randomQty, "pending", randomCust]);
        }

        const placeholders = values.map(() => "(?, ?, ?)").join(", ");
        const [result] = await connection.query(
            `INSERT INTO \`orders\`(\`quantity\`, \`order_status\`, \`customer_id\`) VALUES ${placeholders}`,
            values.flat()
        );

        const insertResult = result as any;
        res.status(201).json({
            affected_row: insertResult.affectedRows,
            message: `Successfully seeded ${amount} orders`,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection?.release();
    }
};

// 2.4 เพิ่มออเดอร์ใหม่
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { quantity, customer_id, order_status } = req.body;

        if (quantity === undefined || customer_id === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 || Number(quantity) > 3) {
            return res.status(400).json({ error: "Quantity must be between 1 and 3" });
        }
        const status = order_status || "pending";
        if (!ALLOWED_STATUS.includes(status)) {
            return res.status(400).json({ error: "Invalid order_status" });
        }

        const sql = "INSERT INTO `orders`(`quantity`, `order_status`, `customer_id`) VALUES (?, ?, ?)";
        const [result] = await conn.query(sql, [quantity, status, customer_id]);

        const insertResult = result as any;
        res.status(201).json({
            affected_row: insertResult.affectedRows,
            last_idx: insertResult.insertId,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2.5 แก้ไขจำนวนกล่อง / สถานะ
// PUT /api/orders/:id
export const updateOrderByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { quantity, customer_id, order_status } = req.body;

        const [rows] = await conn.query("SELECT * FROM `orders` WHERE `order_id`=?", [id]);
        const list = rows as any[];
        if (list.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        const current = list[0];
        const newQty = quantity !== undefined ? quantity : current.quantity;
        const newStatus = order_status !== undefined ? order_status : current.order_status;
        const newCust = customer_id !== undefined ? customer_id : current.customer_id;

        if (!ALLOWED_STATUS.includes(newStatus)) {
            return res.status(400).json({ error: "Invalid order_status" });
        }

        const sql = "UPDATE `orders` SET `quantity`=?, `order_status`=?, `customer_id`=? WHERE `order_id`=?";
        const [result] = await conn.query(sql, [newQty, newStatus, newCust, id]);

        const updateResult = result as any;
        res.status(200).json({
            affected_row: updateResult.affectedRows,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2.6 ลบออเดอร์ทีละรายการ
// DELETE /api/orders/:id
export const deleteOrderByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [result] = await conn.query("DELETE FROM `orders` WHERE `order_id`=?", [id]);

        const deleteResult = result as any;
        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.status(200).json({
            affected_row: deleteResult.affectedRows,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 2.7 ล้างออเดอร์ทั้งหมด
// DELETE /api/orders
export const clearOrders = async (_req: Request, res: Response) => {
    try {
        const [result] = await conn.query("DELETE FROM `orders`");

        const deleteResult = result as any;
        res.status(200).json({
            affected_row: deleteResult.affectedRows,
            message: "All orders cleared",
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
