import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { conn } from "../config/database";
import type { OrderPostRequest, OrderRow } from "../models/order.model";

type OrderRecord = OrderRow & RowDataPacket;

export const OrderRepository = {
  async findAll() {
    const [rows] = await conn.query<OrderRecord[]>(`
      SELECT o.order_id, o.quantity, o.order_status, o.created_at,
             c.customer_id, c.first_name, c.last_name, c.phone_number, c.latitude, c.longitude, c.address_detail
      FROM \`orders\` o
      JOIN \`customers\` c ON o.customer_id = c.customer_id
      ORDER BY o.order_id DESC
    `);
    return rows;
  },

  async findNearby(latitude: number, longitude: number, radius: number) {
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
    const [rows] = await conn.query<OrderRecord[]>(sql, [latitude, longitude, latitude, radius]);
    return rows;
  },

  async create(order: OrderPostRequest) {
    const [result] = await conn.query<ResultSetHeader>(
      "INSERT INTO `orders`(`quantity`, `order_status`, `customer_id`) VALUES (?, ?, ?)",
      [order.quantity, order.order_status || "pending", order.customer_id],
    );
    return result;
  },

  async createMany(values: Array<[number, string, number]>) {
    const [result] = await conn.query<ResultSetHeader>(
      "INSERT INTO `orders`(`quantity`, `order_status`, `customer_id`) VALUES ?", [values],
    );
    return result;
  },

  async update(id: string, order: OrderPostRequest) {
    const [result] = await conn.query<ResultSetHeader>(
      "UPDATE `orders` SET `quantity`=?, `order_status`=COALESCE(?, `order_status`) WHERE `order_id`=?",
      [order.quantity, order.order_status, id],
    );
    return result;
  },

  async delete(id: string) {
    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM `orders` WHERE `order_id`=?", [id],
    );
    return result;
  },

  async deleteAll() {
    const [result] = await conn.query<ResultSetHeader>("DELETE FROM `orders`");
    return result;
  },
};
