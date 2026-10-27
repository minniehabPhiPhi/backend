import { conn } from "./database";

// สร้างตารางให้อัตโนมัติถ้ายังไม่มี (ไม่แตะข้อมูลเดิม)
// คอลัมน์ตรงกับที่ repositories ใช้
export async function ensureSchema() {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`customers\` (
      \`customer_id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`first_name\` VARCHAR(100) NOT NULL,
      \`last_name\` VARCHAR(100) NOT NULL DEFAULT '',
      \`phone_number\` VARCHAR(20) NOT NULL DEFAULT '',
      \`latitude\` DECIMAL(10,7) NOT NULL,
      \`longitude\` DECIMAL(10,7) NOT NULL,
      \`address_detail\` VARCHAR(255) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`orders\` (
      \`order_id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`quantity\` INT NOT NULL,
      \`order_status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
      \`customer_id\` INT NOT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_orders_customer\` FOREIGN KEY (\`customer_id\`)
        REFERENCES \`customers\`(\`customer_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
