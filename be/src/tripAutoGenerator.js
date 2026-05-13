const dayjs = require('dayjs');
const pool = require('./config/db'); // Kiểm tra lại đường dẫn này cho đúng với máy ông

const autoGenerateTrips = async () => {
    console.log('--- 🚌 Đang bắt đầu điều phối xe thông minh (10 ngày tới) ---');

    const fixedRoutes = [
        { origin: 'Sài Gòn', destination: 'Khánh Hòa', price: 300000 },
        { origin: 'Khánh Hòa', destination: 'Sài Gòn', price: 300000 }
    ];
    // Sắp xếp thời gian từ sớm đến muộn để gán xe theo trình tự thời gian
    const times = ['10:00:00', '22:00:00'];

    try {
        // BƯỚC 0: Giải phóng những xe đã hoàn thành chuyến (về trạng thái Ready)
        await pool.query(`
            UPDATE vehicles 
            SET status = 'Ready' 
            WHERE status = 'On Road' AND estimated_ready_time <= NOW()
        `);

        // Lặp qua từng ngày
        for (let i = 1; i <= 10; i++) {
            const targetDate = dayjs().add(i, 'day').format('YYYY-MM-DD');

            for (const time of times) {
                for (const route of fixedRoutes) {
                    const departureFull = `${targetDate} ${time}`;

                    // 1. Kiểm tra chuyến xe đã tồn tại chưa
                    const [existing] = await pool.query(
                        'SELECT id, vehicle_id FROM trips WHERE origin = ? AND destination = ? AND departure_time = ?',
                        [route.origin, route.destination, departureFull]
                    );

                    let tripId;
                    let currentVehicleId = null;

                    if (existing.length === 0) {
                        const [result] = await pool.query(
                            'INSERT INTO trips (origin, destination, departure_time, price) VALUES (?, ?, ?, ?)',
                            [route.origin, route.destination, departureFull, route.price]
                        );
                        tripId = result.insertId;
                    } else {
                        tripId = existing[0].id;
                        currentVehicleId = existing[0].vehicle_id;
                    }

                    // 2. Nếu chuyến chưa có xe, tìm xe theo logic LỘ TRÌNH KHÉP KÍN
                    if (!currentVehicleId) {
                        const [availableVehicles] = await pool.query(
                            `SELECT id, license_plate FROM vehicles 
                             WHERE current_station = ? 
                             AND (status = 'Ready' OR estimated_ready_time <= DATE_SUB(?, INTERVAL 2 HOUR))
                             ORDER BY estimated_ready_time ASC LIMIT 1`,
                            [route.origin, departureFull]
                        );

                        if (availableVehicles.length > 0) {
                            const vId = availableVehicles[0].id;
                            const vPlate = availableVehicles[0].license_plate;

                            // Giả định đi mất 8 tiếng
                            const arrivalTime = dayjs(departureFull).add(8, 'hour').format('YYYY-MM-DD HH:mm:ss');
                            // Cập nhật bảng Trips
                            await pool.query('UPDATE trips SET vehicle_id = ? WHERE id = ?', [vId, tripId]);

                            // CẬP NHẬT XE: 
                            // - Đổi station sang điểm ĐẾN (để chuyến sau nó chạy ngược lại)
                            // - Cập nhật giờ rảnh mới
                            await pool.query(`
                                UPDATE vehicles 
                                SET status = 'On Road', 
                                    current_station = ?, 
                                    estimated_ready_time = ? 
                                WHERE id = ?`,
                                [route.destination, arrivalTime, vId]
                            );

                            console.log(`✅ Gán xe ${vPlate} cho: ${route.origin} -> ${route.destination} [${departureFull}]`);
                        } else {
                            console.log(`⚠️ Hết xe tại ${route.origin} cho chuyến ${departureFull}`);
                        }
                    }
                }
            }
        }
        console.log('--- ✨ Hoàn tất điều phối xe ---');
    } catch (err) {
        console.error('❌ Lỗi generator:', err.message);
    }
};

module.exports = autoGenerateTrips;