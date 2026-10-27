import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// รองรับ DATABASE_URL แบบ mysql://user:pass@host:port/dbname?ssl-mode=REQUIRED
// ถ้ามีจะใช้ค่านี้ก่อน DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : undefined;

const host = url?.hostname || process.env.DB_HOST || 'thitiya-msu-3632.c.aivencloud.com';
const sslMode = url?.searchParams.get('ssl-mode')?.toUpperCase();

// Aiven บังคับใช้ SSL ถ้าไม่เปิด จะต่อฐานข้อมูลไม่ได้
const useSsl = process.env.DB_SSL
    ? process.env.DB_SSL === 'true'
    : sslMode
        ? sslMode !== 'DISABLED'
        : host.endsWith('.aivencloud.com');

export const conn = createPool({
    connectionLimit: 10,
    host,
    port: Number(url?.port || process.env.DB_PORT || 18045),
    user: url ? decodeURIComponent(url.username) : (process.env.DB_USER || 'avnadmin'),
    // อย่าใส่รหัสผ่านไว้ในโค้ด (repo เป็น public) ให้ตั้งใน .env หรือ Render Environment
    password: url ? decodeURIComponent(url.password) : (process.env.DB_PASSWORD || ''),
    database: url?.pathname.replace(/^\//, '') || process.env.DB_NAME || 'defaultdb',
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
