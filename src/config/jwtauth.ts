import { expressjwt } from "express-jwt";
import jwt from "jsonwebtoken";

export const secret = process.env.JWT_SECRET || "this-is-top-secret";

// ตรวจ JWT ก่อนเข้า API ย่อย
export const jwtAuthen = expressjwt({
    secret: secret,
    algorithms: ["HS256"],
}).unless({
    // path ที่ไม่ต้องเช็ก token
    path: ["/", "/testtoken", "/uploads"],
});

// สร้าง token ใหม่
export function generateToken(payload: any, secretKey: string): string {
    return jwt.sign(payload, secretKey, {
        expiresIn: "30d",
        issuer: "CS-MSU",
    });
}

// ตรวจ token แบบ manual
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
