"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthen = exports.secret = void 0;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const express_jwt_1 = require("express-jwt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.secret = "this-is-top-secret"; // ควรเป็นค่าสุ่มยาวๆ และเก็บเป็นตัวแปร env
// มิดเดิลแวร์สำหรับดักตรวจสอบ JWT ก่อนเปิดให้เข้าใช้งาน API ย่อย
exports.jwtAuthen = (0, express_jwt_1.expressjwt)({
    secret: exports.secret,
    algorithms: ["HS256"],
}).unless({
    // ระบุ Path ที่ไม่ต้องเช็กตั๋ว (เช่น หน้า Login/Register หรือหน้าแรก)
    path: ["/", "/register", "/login", "/testtoken"],
});
// ฟังก์ชันช่วยสร้างตั๋ว JWT ใหม่
function generateToken(payload, secretKey) {
    return jsonwebtoken_1.default.sign(payload, secretKey, {
        expiresIn: "30d", // ให้ตั๋วหมดอายุใน 30 วัน
        issuer: "CS-MSU"
    });
}
// ฟังก์ชันดึงค่าและตรวจสอบตั๋วแบบแมนนวล (หากต้องการใช้ตรวจส่วนอื่น)
function verifyToken(token, secretKey) {
    try {
        const decodedPayload = jsonwebtoken_1.default.verify(token, secretKey);
        return { valid: true, decoded: decodedPayload };
    }
    catch (error) {
        return { valid: false, error: JSON.stringify(error) };
    }
}
//# sourceMappingURL=jwtauth.js.map