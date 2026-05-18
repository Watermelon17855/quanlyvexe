const pool = require('../config/db');

exports.createBooking = async (req, res) => {
    const { trip_id, customer_name, customer_phone, seat_number } = req.body;

    if (!trip_id || !customer_name || !customer_phone || !seat_number) {
        return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin khách hàng và số ghế" });
    }

    try {
        const [result] = await pool.query(
            // THÊM cột status và gán giá trị 'pending' trực tiếp ở đây
            'INSERT INTO bookings (trip_id, customer_name, customer_phone, seat_number, status) VALUES (?, ?, ?, ?, ?)',
            [trip_id, customer_name, customer_phone, seat_number, 'pending']
        );

        res.status(201).json({
            message: "Đặt vé thành công, vui lòng thanh toán để xác nhận",
            bookingId: result.insertId,
            status: 'pending'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Ghế này đã có người đặt, vui lòng chọn ghế khác" });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                b.id, b.customer_name, b.customer_phone, 
                b.seat_number, b.status, b.booking_date,
                t.origin, t.destination, t.departure_time,
                -- Thêm logic kiểm tra xem chuyến đi đã kết thúc chưa
                IF(t.departure_time < NOW(), 'completed', 'active') as trip_status
            FROM bookings b
            LEFT JOIN trips t ON b.trip_id = t.id
            WHERE b.status = 'confirmed'
            ORDER BY t.departure_time DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);
        res.json({ message: "Đã hủy vé thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.transferBooking = async (req, res) => {
    const { bookingId } = req.params;
    const { new_trip_id, new_seat_number } = req.body;

    try {
        // 1. Kiểm tra xem ghế ở chuyến mới đã bị ai đặt chưa
        const [existing] = await pool.query(
            'SELECT id FROM bookings WHERE trip_id = ? AND seat_number = ? AND status = "confirmed"',
            [new_trip_id, new_seat_number]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: "Ghế này ở chuyến mới đã có người đặt rồi ông ơi!" });
        }

        // 2. Cập nhật vé sang chuyến mới
        await pool.query(
            'UPDATE bookings SET trip_id = ?, seat_number = ?, booking_date = NOW() WHERE id = ?',
            [new_trip_id, new_seat_number, bookingId]
        );

        res.json({ message: "Chuyển vé thành công sang chuyến mới!" });
    } catch (err) {
        console.error("Lỗi chuyển vé:", err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.checkStatus = async (req, res) => {
    const { trip_id, seat_number } = req.query;
    const [rows] = await pool.query(
        'SELECT status FROM bookings WHERE trip_id = ? AND seat_number = ?',
        [trip_id, seat_number]
    );
    res.json({ confirmed: rows[0]?.status === 'confirmed' });
};