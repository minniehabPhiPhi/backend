import { createPool } from 'mysql2/promise';

export const conn = createPool({
    connectionLimit: 10,
    host: 'thitiya-msu-3632.c.aivencloud.com',
    port: 18045,
    user: 'avnadmin',
    password: 'AVNS__R7u3oWuL5pDA5GGGdT',
    database: 'Lunchdelivery'
});