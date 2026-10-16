import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const conn = createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'thitiya-msu-3632.c.aivencloud.com',
    port: Number(process.env.DB_PORT || 18045),
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS__R7u3oWuL5pDA5GGGdT',
    database: process.env.DB_NAME || 'lunch_delivery'
});
