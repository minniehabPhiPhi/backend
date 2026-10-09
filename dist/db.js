"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conn = void 0;
const promise_1 = require("mysql2/promise");
exports.conn = (0, promise_1.createPool)({
    connectionLimit: 10,
    host: 'thitiya-msu-3632.c.aivencloud.com',
    port: 18045,
    user: 'avnadmin',
    password: 'AVNS__R7u3oWuL5pDA5GGGdT',
    database: 'Lunchdelivery'
});
//# sourceMappingURL=db.js.map