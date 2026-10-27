import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { conn } from "../config/database";
import type { CustomerId, CustomerPostRequest, CustomerRow } from "../models/customer.model";

type CustomerRecord = CustomerRow & RowDataPacket;
type CustomerIdRecord = CustomerId & RowDataPacket;

export const CustomerRepository = {
  async findAll(search?: string) {
    let sql = "SELECT * FROM `customers`";
    const params: string[] = [];
    if (search) {
      sql += " WHERE `first_name` LIKE ? OR `last_name` LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }
    const [rows] = await conn.query<CustomerRecord[]>(sql, params);
    return rows;
  },

  async findNearby(latitude: number, longitude: number, radius: number) {
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
    const [rows] = await conn.query<CustomerRecord[]>(sql, [latitude, longitude, latitude, radius]);
    return rows;
  },

  async findIds() {
    const [rows] = await conn.query<CustomerIdRecord[]>("SELECT `customer_id` FROM `customers`");
    return rows;
  },

  async create(customer: CustomerPostRequest) {
    const [result] = await conn.query<ResultSetHeader>(
      "INSERT INTO `customers`(`first_name`, `last_name`, `phone_number`, `latitude`, `longitude`, `address_detail`) VALUES (?,?,?,?,?,?)",
      [customer.first_name, customer.last_name, customer.phone_number,
        customer.latitude, customer.longitude, customer.address_detail],
    );
    return result;
  },

  async update(id: string, customer: CustomerPostRequest) {
    const [result] = await conn.query<ResultSetHeader>(
      "UPDATE `customers` SET `first_name`=?, `last_name`=?, `phone_number`=?, `latitude`=?, `longitude`=?, `address_detail`=? WHERE `customer_id`=?",
      [customer.first_name, customer.last_name, customer.phone_number,
        customer.latitude, customer.longitude, customer.address_detail, id],
    );
    return result;
  },

  async delete(id: string) {
    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM `customers` WHERE `customer_id`=?", [id],
    );
    return result;
  },
};
