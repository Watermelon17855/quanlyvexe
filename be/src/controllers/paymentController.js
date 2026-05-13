const pool = require('../config/db');

exports.sepayWebhook = async (req, res) => {
    const data = req.body;

    console.log("📩 Nhận Webhook từ SePay:", data);

    try {
        const content = data.content || "";
        const amount = data.transferAmount;

        console.log("CONTENT:", content);
        console.log("AMOUNT:", amount);

        // Hỗ trợ:
        // VEXE109A04
        // VEXE 109 A04
        // vexe109a04
        const match = content
            .toUpperCase()
            .trim()
            .match(/VEXE\s*(\d+)\s*([A-Z]\d+)/);

        console.log("MATCH:", match);

        if (match) {
            const tripId = match[1];
            const seatNumber = match[2];

            console.log("TRIP:", tripId);
            console.log("SEAT:", seatNumber);

            const [result] = await pool.query(
                `UPDATE bookings 
                 SET status = 'confirmed' 
                 WHERE trip_id = ? 
                 AND seat_number = ? 
                 AND status = 'pending'`,
                [tripId, seatNumber]
            );

            console.log("UPDATE RESULT:", result);

            if (result.affectedRows > 0) {
                console.log(`✅ Xác nhận thành công ghế ${seatNumber} chuyến ${tripId}`);
            } else {
                console.log("❌ Không tìm thấy booking pending phù hợp");
            }
        } else {
            console.log("❌ Regex không match nội dung chuyển khoản");
        }

        res.status(200).json({ status: 'success' });

    } catch (err) {
        console.error("❌ Lỗi Webhook:", err);
        res.status(500).send("Lỗi Server");
    }
};