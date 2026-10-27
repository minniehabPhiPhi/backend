import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";

export const projectRoot = path.resolve(__dirname, "../..");
const envPath = path.join(projectRoot, ".env");
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

// รองรับ DATABASE_URL แบบ mysql://user:pass@host:port/dbname?ssl-mode=REQUIRED
// ถ้ามีจะใช้ค่านี้ก่อน DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
const dbUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : undefined;
if (dbUrl) {
  process.env.DB_HOST = dbUrl.hostname;
  process.env.DB_PORT = dbUrl.port || "3306";
  process.env.DB_USER = decodeURIComponent(dbUrl.username);
  process.env.DB_PASSWORD = decodeURIComponent(dbUrl.password);
  process.env.DB_NAME = dbUrl.pathname.replace(/^\//, "") || "defaultdb";
  const sslMode = dbUrl.searchParams.get("ssl-mode")?.toUpperCase();
  if (sslMode && !process.env.DB_SSL) {
    process.env.DB_SSL = sslMode === "DISABLED" ? "false" : "true";
  }
}

const dbHost = process.env.DB_HOST ?? "localhost";
// Aiven (และ cloud MySQL ส่วนใหญ่) บังคับใช้ SSL
// เปิดอัตโนมัติเมื่อ host เป็น aivencloud.com หรือกำหนด DB_SSL=true
// ถ้ามี DB_SSL_CA (เนื้อหาไฟล์ ca.pem) จะตรวจใบรับรองแบบเต็ม
const useSsl = process.env.DB_SSL
  ? process.env.DB_SSL === "true"
  : dbHost.endsWith(".aivencloud.com");
const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, "\n");
const ssl = useSsl
  ? (sslCa ? { ca: sslCa, rejectUnauthorized: true } : { rejectUnauthorized: false })
  : undefined;

export const env = {
  port: Number(process.env.PORT ?? 3000),
  database: {
    host: dbHost,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "lunch_delivery",
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10),
    ...(ssl ? { ssl } : {}),
  },
  jwtSecret: process.env.JWT_SECRET ?? "this-is-top-secret",
  corsOrigins: (
    process.env.CORS_ORIGINS ??
    "http://localhost:4200,http://127.0.0.1:5500,http://localhost:5500"
  ).split(",").map((origin) => origin.trim()).filter(Boolean),
  uploadDirectory: path.resolve(projectRoot, process.env.UPLOAD_DIR ?? "uploads"),
  maxUploadSize: Number(process.env.MAX_UPLOAD_SIZE ?? 67108864),
};
