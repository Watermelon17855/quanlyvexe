const pool = require('../config/db');

exports.sepayWebhook = async (req, res) => {
    const data = req.body;

    console.log("📩 Nhận Webhook từ SePay:", data);

    try {
        if (!data || !data.content) {
            return res.status(200).json({ success: false, message: 'Dữ liệu trống' });
        }

        const content = data.content.toUpperCase().trim();

        // Regex bóc tách: lấy ID chuyến xe và toàn bộ chuỗi ghế phía sau
        // Ví dụ: "ND VEXE107A08A09" -> tripId: 107, seatString: A08A09
        const match = content.match(/VEXE\s*(\d+)\s*([A-Z0-9]+)/);

        if (!match) {
            console.log("❌ Không khớp cú pháp VEXE:", content);
            return res.status(200).json({ success: false });
        }

        const tripId = Number(match[1]);
        const seatString = match[2]; // Chuỗi chứa các ghế như A08A09...

        // Tách chuỗi ghế thành mảng (Cứ chữ cái A hoặc B là bắt đầu ghế mới)
        const seats = seatString.match(/[A-Z]\d+/g);

        if (!seats || seats.length === 0) {
            console.log("❌ Không tìm thấy mã ghế trong nội dung");
            return res.status(200).json({ success: false });
        }

        console.log(`🔍 Đang xử lý: Chuyến ${tripId}, Danh sách ghế:`, seats);

        // Update tất cả các ghế có trong nội dung chuyển khoản
        const [updateResult] = await pool.query(
            `UPDATE bookings 
             SET status = 'confirmed' 
             WHERE trip_id = ? 
             AND seat_number IN (?) 
             AND status = 'pending'`,
            [tripId, seats]
        );

        if (updateResult.affectedRows > 0) {
            console.log(`✅ THÀNH CÔNG: Đã xác nhận ${updateResult.affectedRows} ghế cho chuyến ${tripId}`);
        } else {
            console.log("⚠️ Không tìm thấy booking PENDING nào khớp để update.");
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("❌ Lỗi Webhook:", err.message);
        return res.status(500).json({ success: false });
    }
};