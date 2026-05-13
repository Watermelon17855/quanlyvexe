const express = require('express');
const cors = require('cors');
const tripRoutes = require('./routes/tripRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// 1. Cấu hình CORS
app.use(cors());

// 2. Middleware đọc JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Định nghĩa các Routes
// Gom tất cả những gì liên quan đến Trip (Lấy danh sách, tạo mới, lấy location) vào một cụm
app.use('/api/trips', tripRoutes);

// Quản lý đặt vé
app.use('/api/bookings', bookingRoutes);

// Quản lý xe (Biển số xe, trạng thái xe)
app.use('/api/vehicles', vehicleRoutes);

// Xử lý thanh toán từ SePay
app.use('/api/payments', paymentRoutes);

module.exports = app;