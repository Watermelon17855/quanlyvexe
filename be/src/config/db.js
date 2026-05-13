const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 16141, // Thêm dòng này để nhận cổng 16141 từ .env
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Thêm đoạn này để test kết nối ngay khi chạy server
pool.getConnection()
    .then(conn => {
        console.log('✅ Đã kết nối thành công tới Aiven MySQL!');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = pool;