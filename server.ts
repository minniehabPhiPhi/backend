import http from "http";
import dotenv from "dotenv";

dotenv.config();

import { app } from "./app";
import { ensureSchema } from "./src/config/schema";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// สร้างตาราง customers / orders ถ้ายังไม่มี (ไม่แตะข้อมูลเดิม)
ensureSchema()
    .then(() => console.log("Database tables ready"))
    .catch((error) => console.error("Could not prepare database tables:", error));

server.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
}).on("error", (error) => {
    console.error(error);
});
