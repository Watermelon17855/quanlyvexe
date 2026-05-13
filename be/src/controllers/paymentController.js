const pool = require('../config/db');

exports.sepayWebhook = async (req, res) => {
    const data = req.body;

    console.log("📩 Nhận Webhook từ SePay:");
    console.log(data);

    try {
        const content = (data.content || "").toUpperCase().trim();
        const amount = Number(data.transferAmount || 0);

        console.log("📌 Content:", content);
        console.log("💰 Amount:", amount);

        // Hỗ trợ:
        // VEXE109A01
        // VEXE109A01A02
        // vexe109a01
        const match = content.match(/VEXE(\d+)([A-Z]\d+)/);

        console.log("🔍 Match:", match);

        if (!match) {
            console.log("❌ Không match được mã thanh toán");
            return res.status(200).json({
                success: false,
                message: 'Không đúng cú pháp thanh toán'
            });
        }

        const tripId = match[1];
        const seatNumber = match[2];

        console.log("🚌 Trip ID:", tripId);
        console.log("💺 Seat:", seatNumber);

        // Tìm booking pending
        const [bookingRows] = await pool.query(
            `SELECT * FROM bookings
             WHERE trip_id = ?
             AND seat_number = ?
             AND status = 'pending'`,
            [tripId, seatNumber]
        );

        console.log("📄 Booking tìm được:", bookingRows);

        if (bookingRows.length === 0) {
            console.log("❌ Không tìm thấy booking pending");
            return res.status(200).json({
                success: false,
                message: 'Không tìm thấy booking pending'
            });
        }

        // Update booking
        const [updateResult] = await pool.query(
            `UPDATE bookings
             SET status = 'confirmed'
             WHERE trip_id = ?
             AND seat_number = ?
             AND status = 'pending'`,
            [tripId, seatNumber]
        );

        console.log("📝 Update Result:", updateResult);

        if (updateResult.affectedRows > 0) {
            console.log(`✅ Xác nhận thành công ghế ${seatNumber} chuyến ${tripId}`);
        } else {
            console.log("❌ Update thất bại");
        }

        return res.status(200).json({
            success: true
        });

    } catch (err) {
        console.error("❌ Lỗi Webhook:", err);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
