import { Request, Response } from "express";
import { conn } from "../config/dbconnect";
import { CustomerModel } from "../models/customerModel";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

// 1.1 ดูข้อมูลลูกค้าทั้งหมด / ค้นหาจากชื่อ-นามสกุล
// GET /api/customers?search=สม
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const { search } = req.query;
        let sql = "SELECT * FROM `customers` ORDER BY `customer_id`";
        const params: any[] = [];

        if (search) {
            sql = "SELECT * FROM `customers` WHERE `first_name` LIKE ? OR `last_name` LIKE ? ORDER BY `customer_id`";
            params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await conn.query(sql, params);
        res.status(200).json(rows as CustomerModel[]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 1.2 หาลูกค้าในรัศมีรอบพิกัด (ดีฟอลต์ 1 กม.)
// GET /api/customers/nearby?lat=16.24&lng=103.25&radius=1
export const getNearbyCustomers = async (req: Request, res: Response) => {
    try {
        // รองรับทั้ง lat/lng และ latitude/longitude
        const latRaw = (req.query.lat ?? req.query.latitude) as string | undefined;
        const lngRaw = (req.query.lng ?? req.query.longitude) as string | undefined;
        const lat = parseFloat(latRaw || "");
        const lng = parseFloat(lngRaw || "");
        const radius = parseFloat((req.query.radius as string) || "1");

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Missing required query params: lat, lng" });
        }

        const sql = `
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

        const [rows] = await conn.query(sql, [lat, lng, lat, radius]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// ดูข้อมูลลูกค้าคนเดียว
// GET /api/customers/:id
export const getCustomersByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [rows] = await conn.query("SELECT * FROM `customers` WHERE `customer_id`=?", [id]);
        const list = rows as CustomerModel[];
        if (list.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.status(200).json(list[0]);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 1.3 เพิ่มลูกค้าใหม่
// POST /api/customers
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, phone_number, latitude, longitude, address_detail } = req.body;

        if (!first_name || !last_name || !phone_number || !address_detail) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const sql =
            "INSERT INTO `customers`(`first_name`, `last_name`, `phone_number`, `latitude`, `longitude`, `address_detail`) VALUES (?,?,?,?,?,?)";

        const [result] = await conn.query(sql, [
            first_name,
            last_name,
            phone_number,
            latitude,
            longitude,
            address_detail,
        ]);

        const insertResult = result as any;
        const header = result as ResultSetHeader;
        void header;
        res.status(201).json({
            affected_row: insertResult.affectedRows,
            last_idx: insertResult.insertId,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 1.4 แก้ไขข้อมูลลูกค้า
// PUT /api/customers/:id
export const updateCustomerByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone_number, latitude, longitude, address_detail } = req.body;

        const sql =
            "UPDATE `customers` SET `first_name`=?, `last_name`=?, `phone_number`=?, `latitude`=?, `longitude`=?, `address_detail`=? WHERE `customer_id`=?";

        const [result] = await conn.query(sql, [
            first_name,
            last_name,
            phone_number,
            latitude,
            longitude,
            address_detail,
            id,
        ]);

        const updateResult = result as any;
        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.status(200).json({
            affected_row: updateResult.affectedRows,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 1.5 ลบลูกค้า (ลบออเดอร์ของลูกค้าคนนี้ทิ้งด้วย)
// DELETE /api/customers/:id
export const deleteCustomerByID = async (req: Request, res: Response) => {
    let connection: PoolConnection | undefined;
    try {
        const { id } = req.params;
        connection = await conn.getConnection();
        await connection.beginTransaction();

        await connection.query("DELETE FROM `orders` WHERE `customer_id`=?", [id]);
        const [result] = await connection.query("DELETE FROM `customers` WHERE `customer_id`=?", [id]);

        const deleteResult = result as any;
        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Customer not found" });
        }

        await connection.commit();
        res.status(200).json({
            affected_row: deleteResult.affectedRows,
        });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: "Internal server error" });
    } finally {
        connection?.release();
    }
};
