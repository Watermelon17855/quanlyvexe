const pool = require('../config/db');

exports.getAllVehicles = async (req, res) => {
    try {
        // Tự động giải phóng xe trong Database nếu đã quá giờ sẵn sàng
        await pool.query(`
            UPDATE vehicles 
            SET status = 'Ready' 
            WHERE status = 'On Road' AND estimated_ready_time <= NOW()
        `);

        // Sau đó mới trả về danh sách để Admin thấy màu xanh "Sẵn sàng"
        const [rows] = await pool.query('SELECT * FROM vehicles');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Thêm xe mới vào đội
exports.addVehicle = async (req, res) => {
    const { license_plate, current_station } = req.body;
    try {
        await pool.query(
            'INSERT INTO vehicles (license_plate, current_station, status, estimated_ready_time) VALUES (?, ?, "Ready", NOW())',
            [license_plate, current_station]
        );
        res.status(201).json({ message: "Đã thêm xe vào đội thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateVehicleLocation = async (req, res) => {
    const { id } = req.params;
    const { current_station } = req.body;

    try {
        const [result] = await pool.query(
            'UPDATE vehicles SET current_station = ? WHERE id = ?',
            [current_station, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy xe này!" });
        }

        res.json({ message: "Cập nhật vị trí xe thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    const { id } = req.params;
    try {
        // Kiểm tra xem xe có đang trong chuyến nào không
        const [trips] = await pool.query('SELECT id FROM trips WHERE vehicle_id = ? LIMIT 1', [id]);

        if (trips.length > 0) {
            return res.status(400).json({
                message: 'Xe này đang có lịch chạy, không thể xóa ông ơi!'
            });
        }

        await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
        res.json({ message: 'Đã xóa xe thành column thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi xóa xe' });
    }
};