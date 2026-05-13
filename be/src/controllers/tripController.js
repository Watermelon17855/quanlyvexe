const pool = require('../config/db');

/**
 * Hàm bổ trợ: Chuyển đổi Date Object sang định dạng MySQL (YYYY-MM-DD HH:mm:ss)
 * Giữ nguyên múi giờ địa phương, tránh lỗi lệch 7 tiếng của toISOString()
 */
const formatToMySQL = (dateInput) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 1. Lấy danh sách chuyến xe (Kèm biển số xe)
exports.getAllTrips = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, v.license_plate 
            FROM trips t
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            ORDER BY t.departure_time DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Lấy danh sách ghế đã đặt
exports.getBookedSeats = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT seat_number FROM bookings WHERE trip_id = ? AND status != "cancelled"',
            [id]
        );
        res.json(rows.map(row => row.seat_number));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Lấy danh sách các địa điểm đang có chuyến xe
exports.getLocations = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT origin AS location FROM trips
            UNION
            SELECT DISTINCT destination AS location FROM trips
        `);
        const locations = rows.map(row => row.location);
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. TẠO CHUYẾN XE VÀ TỰ ĐỘNG GÁN XE
exports.createTrip = async (req, res) => {
    const { origin, destination, departure_time, price } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Bước A: Tạo chuyến xe mới trong bảng trips
        const [tripResult] = await connection.query(
            'INSERT INTO trips (origin, destination, departure_time, price) VALUES (?, ?, ?, ?)',
            [origin, destination, departure_time, price]
        );
        const tripId = tripResult.insertId;

        // Bước B: Chuẩn bị thời gian để so sánh
        // Lấy giờ đi của khách theo định dạng chuẩn YYYY-MM-DD HH:mm:ss
        const formattedDeparture = formatToMySQL(departure_time);

        // Bước C: Tìm xe phù hợp (Đúng bến, Ready, Nghỉ đủ)
        // Bước C: Tìm xe phù hợp (Đúng bến, và thỏa mãn 1 trong 2 điều kiện sau)
        // 1. Trạng thái là 'Ready'
        // 2. Trạng thái là 'On Road' (Đang chạy) nhưng thời gian sẵn sàng <= giờ đi của khách
        const [availableVehicles] = await connection.query(`
    SELECT id, license_plate FROM vehicles 
    WHERE current_station = ? 
    AND (
        status = 'Ready' 
        OR (status = 'On Road' AND estimated_ready_time <= ?)
    )
    ORDER BY estimated_ready_time ASC 
    LIMIT 1
`, [origin, formattedDeparture]);

        if (availableVehicles.length > 0) {
            const vehicle = availableVehicles[0];

            // 1. Gán xe vào Trip vừa tạo
            await connection.query('UPDATE trips SET vehicle_id = ? WHERE id = ?', [vehicle.id, tripId]);

            // 2. Tính thời gian xe sẵn sàng tiếp theo (Giờ đi + 8 tiếng chạy & nghỉ)
            const readyTimeRaw = new Date(new Date(departure_time).getTime() + 8 * 60 * 60 * 1000);
            const formattedReadyTime = formatToMySQL(readyTimeRaw);

            // 3. Cập nhật trạng thái xe sang 'On Road' và đẩy xe sang bến đích
            await connection.query(`
                UPDATE vehicles 
                SET status = 'On Road', 
                    current_station = ?, 
                    estimated_ready_time = ?
                WHERE id = ?
            `, [destination, formattedReadyTime, vehicle.id]);

            await connection.commit();
            res.status(201).json({
                success: true,
                message: `Tạo chuyến thành công! Đã điều động xe: ${vehicle.license_plate}`,
                tripId
            });
        } else {
            // Trường hợp không có xe thỏa mãn
            await connection.commit();
            res.status(201).json({
                success: false,
                message: "Đã tạo chuyến! Tuy nhiên hiện tại không có xe rảnh tại bến này.",
                tripId
            });
        }

    } catch (err) {
        await connection.rollback();
        console.error("Lỗi Controller CreateTrip:", err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.deleteTrip = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Kiểm tra xem chuyến xe có tồn tại không và lấy vehicle_id
        const [trip] = await connection.query('SELECT vehicle_id FROM trips WHERE id = ?', [id]);
        if (trip.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy chuyến xe này!" });
        }

        const vehicleId = trip[0].vehicle_id;

        // 2. Kiểm tra xem đã có khách đặt vé chưa (Nếu có thì không cho xóa)
        const [bookings] = await connection.query('SELECT id FROM bookings WHERE trip_id = ?', [id]);
        if (bookings.length > 0) {
            return res.status(400).json({ message: "Không thể xóa! Chuyến xe này đã có khách đặt vé." });
        }

        // 3. Xóa chuyến xe
        await connection.query('DELETE FROM trips WHERE id = ?', [id]);

        // 4. Nếu chuyến này đã được gán xe, hãy giải phóng xe đó về trạng thái Ready
        if (vehicleId) {
            await connection.query(
                "UPDATE vehicles SET status = 'Ready', estimated_ready_time = NOW() WHERE id = ?",
                [vehicleId]
            );
        }

        await connection.commit();
        res.json({ message: "Đã xóa chuyến xe và giải phóng xe thành công!" });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

// be/src/controllers/tripController.js

exports.updateTrip = async (req, res) => {
    const { id } = req.params;
    const { origin, destination, departure_time, price } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Lấy dữ liệu cũ của chuyến xe để so sánh
        const [oldTrip] = await connection.query('SELECT * FROM trips WHERE id = ?', [id]);
        if (oldTrip.length === 0) return res.status(404).json({ message: "Không tìm thấy chuyến xe!" });

        const oldVehicleId = oldTrip[0].vehicle_id;
        const formattedDeparture = formatToMySQL(departure_time);

        // 2. Nếu thay đổi Điểm đi hoặc Thời gian, ta cần gán lại xe
        if (oldTrip[0].origin !== origin || oldTrip[0].departure_time !== departure_time) {

            // Giải phóng xe cũ về Ready (nếu có)
            if (oldVehicleId) {
                await connection.query("UPDATE vehicles SET status = 'Ready' WHERE id = ?", [oldVehicleId]);
            }

            // Tìm xe mới phù hợp với thông số mới
            const [newVehicle] = await connection.query(`
                SELECT id FROM vehicles 
                WHERE current_station = ? 
                AND (status = 'Ready' OR (status = 'On Road' AND estimated_ready_time <= ?))
                ORDER BY estimated_ready_time ASC LIMIT 1
            `, [origin, formattedDeparture]);

            let vehicleId = null;
            if (newVehicle.length > 0) {
                vehicleId = newVehicle[0].id;
                // Cập nhật xe mới sang trạng thái On Road
                const readyTime = formatToMySQL(new Date(new Date(departure_time).getTime() + 8 * 60 * 60 * 1000));
                await connection.query(
                    "UPDATE vehicles SET status = 'On Road', current_station = ?, estimated_ready_time = ? WHERE id = ?",
                    [destination, readyTime, vehicleId]
                );
            }

            // Cập nhật chuyến xe với thông tin mới (có thể vehicle_id là null nếu không tìm thấy xe)
            await connection.query(
                'UPDATE trips SET origin = ?, destination = ?, departure_time = ?, price = ?, vehicle_id = ? WHERE id = ?',
                [origin, destination, departure_time, price, vehicleId, id]
            );
        } else {
            // Nếu chỉ đổi Điểm đến hoặc Giá vé, không cần tính lại xe
            await connection.query(
                'UPDATE trips SET destination = ?, price = ? WHERE id = ?',
                [destination, price, id]
            );
        }

        await connection.commit();
        res.json({ message: "Cập nhật chuyến xe thành công!" });

    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
};

exports.bulkUpdatePrice = async (req, res) => {
    const { ids, price } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Ông chưa chọn chuyến nào để sửa cả!" });
    }

    if (!price || isNaN(price)) {
        return res.status(400).json({ message: "Giá vé không hợp lệ ông ơi!" });
    }

    try {
        // Sử dụng toán tử IN trong SQL để update hàng loạt
        // SQL: UPDATE trips SET price = ? WHERE id IN (1, 2, 3...)
        const [result] = await pool.query(
            'UPDATE trips SET price = ? WHERE id IN (?)',
            [price, ids]
        );

        res.json({
            message: `Ngon lành! Đã cập nhật giá cho ${result.affectedRows} chuyến xe.`,
            affectedRows: result.affectedRows
        });
    } catch (err) {
        console.error("Lỗi bulk update:", err);
        res.status(500).json({ error: "Lỗi hệ thống khi cập nhật hàng loạt!" });
    }
};

exports.bulkDeleteTrips = async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Chưa chọn chuyến nào để xóa ông ơi!" });
    }

    try {
        // SQL: DELETE FROM trips WHERE id IN (1, 2, 3...)
        const [result] = await pool.query(
            'DELETE FROM trips WHERE id IN (?)',
            [ids]
        );

        res.json({ message: `Đã xóa vĩnh viễn ${result.affectedRows} chuyến xe!` });
    } catch (err) {
        console.error(err);
        // Kiểm tra nếu lỗi do khóa ngoại (chuyến đã có người đặt vé)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                message: "Không thể xóa! Có chuyến trong danh sách đã có khách đặt vé rồi."
            });
        }
        res.status(500).json({ error: "Lỗi hệ thống khi xóa hàng loạt" });
    }
};

//client
exports.searchTrips = async (req, res) => {
    const { origin, destination, date } = req.query;

    try {
        // Nếu thiếu thông tin lọc thì không trả về gì hoặc báo lỗi
        if (!origin || !destination || !date) {
            return res.status(400).json({ message: "Thiếu thông tin tìm kiếm!" });
        }

        const [rows] = await pool.query(`
            SELECT t.*, v.license_plate 
            FROM trips t
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            WHERE t.origin = ? 
              AND t.destination = ? 
              AND DATE(t.departure_time) = ?
            ORDER BY t.departure_time ASC
        `, [origin, destination, date]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};