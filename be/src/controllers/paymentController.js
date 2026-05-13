const pool = require('../config/db');

exports.sepayWebhook = async (req, res) => {
    const data = req.body;

    console.log("📩 Nhận Webhook từ SePay:", data);

    try {
        // 1. Kiểm tra an toàn dữ liệu đầu vào
        if (!data || !data.content) {
            return res.status(200).json({ success: false, message: 'Dữ liệu trống' });
        }

        const content = data.content.toUpperCase().trim();

        // 2. Regex linh hoạt hơn (dùng \s* để chấp nhận có hoặc không có dấu cách)
        const match = content.match(/VEXE\s*(\d+)\s*([A-A|B-B]\d+)/);

        if (!match) {
            console.log("❌ Không match được mã:", content);
            return res.status(200).json({ success: false, message: 'Sai cú pháp' });
        }

        // Ép kiểu ID về Number để DB dễ so sánh
        const tripId = Number(match[1]);
        const seatNumber = match[2].trim();

        console.log(`🔍 Đang tìm: Chuyến ${tripId}, Ghế ${seatNumber}`);

        // 3. Tìm booking với log chi tiết hơn
        const [bookingRows] = await pool.query(
            `SELECT id, trip_id, seat_number, status FROM bookings 
             WHERE trip_id = ? AND seat_number = ? AND status = 'pending'`,
            [tripId, seatNumber]
        );

        if (bookingRows.length === 0) {
            // Log này cực quan trọng để ông debug
            console.log(`❌ Thất bại: Không có bản ghi PENDING nào khớp cho Chuyến ${tripId} Ghế ${seatNumber}`);
            return res.status(200).json({ success: false, message: 'Booking không tồn tại hoặc đã xác nhận' });
        }

        // 4. Update
        const [updateResult] = await pool.query(
            `UPDATE bookings SET status = 'confirmed' WHERE id = ?`,
            [bookingRows[0].id] // Update theo ID là chắc cú nhất
        );

        if (updateResult.affectedRows > 0) {
            console.log(`✅ THÀNH CÔNG: Ghế ${seatNumber} chuyến ${tripId} đã được duyệt!`);
            return res.status(200).json({ success: true });
        }

        return res.status(200).json({ success: false, message: 'Update thất bại' });

    } catch (err) {
        console.error("❌ Lỗi hệ thống Webhook:", err.message);
        return res.status(500).json({ success: false });
    }
};