import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";

export const secret = "this-is-top-secret"; // ควรเป็นค่าสุ่มยาวๆ และเก็บเป็นตัวแปร env

// มิดเดิลแวร์สำหรับดักตรวจสอบ JWT ก่อนเปิดให้เข้าใช้งาน API ย่อย
export const jwtAuthen = expressjwt({
  secret: secret,
  algorithms: ["HS256"],
}).unless({
  // ระบุ Path ที่ไม่ต้องเช็กตั๋ว (เช่น หน้า Login/Register หรือหน้าแรก)
  path: ["/", "/register", "/login", "/testtoken"],
});

// ฟังก์ชันช่วยสร้างตั๋ว JWT ใหม่
export function generateToken(payload: any, secretKey: string): string {
  return jwt.sign(payload, secretKey, {
    expiresIn: "30d", // ให้ตั๋วหมดอายุใน 30 วัน
    issuer: "CS-MSU"
  });
}

// ฟังก์ชันดึงค่าและตรวจสอบตั๋วแบบแมนนวล (หากต้องการใช้ตรวจส่วนอื่น)
export function verifyToken(
  token: string,
  secretKey: string
): { valid: boolean; decoded?: any; error?: string } {
  try {
    const decodedPayload = jwt.verify(token, secretKey);
    return { valid: true, decoded: decodedPayload };
  } catch (error) {
    return { valid: false, error: JSON.stringify(error) };
  }
}