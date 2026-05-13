const pool = require('../config/db');

exports.sepayWebhook = async (req, res) => {
    const data = req.body;
    console.log("📩 Nhận Webhook từ SePay:", data);

    try {
        const content = data.content; // Ví dụ: "VEXE 98 A01"
        const amount = data.transferAmount;

        // Regex lấy mã chuyến và số ghế
        const match = content.toUpperCase().match(/VEXE\s+(\d+)\s+([A-B]\d+)/);

        if (match) {
            const tripId = match[1];
            const seatNumber = match[2];

            // Cập nhật vé từ pending -> confirmed
            const [result] = await pool.query(
                "UPDATE bookings SET status = 'confirmed' WHERE trip_id = ? AND seat_number = ? AND status = 'pending'",
                [tripId, seatNumber]
            );

            if (result.affectedRows > 0) {
                console.log(`✅ Xác nhận thành công ghế ${seatNumber} chuyến ${tripId}`);
            }
        }

        // SePay cần nhận 200 OK để không gửi lại webhook nữa
        res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error("❌ Lỗi Webhook:", err);
        res.status(500).send("Lỗi Server");
    }
};