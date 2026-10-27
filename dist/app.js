"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const customers_1 = __importDefault(require("./routes/customers"));
const orders_1 = __importDefault(require("./routes/orders"));
const upload_1 = __importDefault(require("./routes/upload"));
const jwtauth_1 = require("./jwtauth");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use("/api/customers", customers_1.default);
app.use("/api/orders", orders_1.default);
app.use("/upload", upload_1.default);
app.use("/uploads", express_1.default.static("uploads"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
app.use(jwtauth_1.jwtAuthen);
// 2. ดักรับ Error กรณียิงตั๋วปลอม/ตั๋วหมดอายุ (ต้องไว้ถัดจาก jwtAuthen)
app.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        res.status(err.status).json({ message: err.message });
        return;
    }
    next(err);
});
// 3. สร้างเส้นทางสำหรับรับตั๋วทดสอบ
app.use("/testtoken", (req, res) => {
    const payload = { username: "Aj.M" };
    const jwttoken = (0, jwtauth_1.generateToken)(payload, jwtauth_1.secret);
    res.status(200).json({
        token: jwttoken,
    });
});
//# sourceMappingURL=app.js.map