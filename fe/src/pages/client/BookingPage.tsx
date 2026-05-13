import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { type Trip } from '../../types';
import SeatMap from '../../components/client/SeatMap';

const BookingPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const origin = searchParams.get('origin');
            const destination = searchParams.get('destination');
            const date = searchParams.get('date');

            // ✅ SỬA TẠI ĐÂY: Gọi đúng endpoint /search đã viết ở Backend
            const res = await axiosClient.get(`/trips/search`, {
                params: { origin, destination, date }
            });

            setTrips(res.data);

            // ✅ TỰ ĐỘNG CHỌN: Nếu có kết quả, chọn luôn chuyến đầu tiên cho khách đỡ phải click nhiều
            if (res.data.length > 0) {
                setSelectedTripId(res.data[0].id);
            } else {
                setSelectedTripId(null);
            }
        } catch (err) {
            console.error("Lỗi lấy danh sách chuyến:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [searchParams]);

    return (
        <div style={{ background: '#1a1a1a', minHeight: '100vh', color: '#fff', padding: '30px' }}>
            <button onClick={() => navigate('/')} style={{
                background: 'none', border: '1px solid #555', color: '#ccc',
                padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px'
            }}>
                ← Quay lại tìm kiếm
            </button>

            <div style={{ display: 'flex', gap: '40px' }}>
                {/* DANH SÁCH CHUYẾN XE */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: '20px' }}>Kết quả tìm kiếm</h2>
                    {loading ? <p>Đang tìm chuyến...</p> : (
                        <>
                            {trips.length === 0 && (
                                <div style={{ padding: '40px', background: '#222', borderRadius: '12px', textAlign: 'center' }}>
                                    <p style={{ color: '#888' }}>☹ Rất tiếc, không tìm thấy chuyến xe nào đúng yêu cầu của bạn.</p>
                                </div>
                            )}
                            {trips.map(trip => (
                                <div
                                    key={trip.id}
                                    onClick={() => setSelectedTripId(trip.id)}
                                    style={{
                                        padding: '20px',
                                        border: selectedTripId === trip.id ? '1px solid #52c41a' : '1px solid #333',
                                        marginBottom: '15px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        background: selectedTripId === trip.id ? '#1a331a' : '#222',
                                        transition: 'all 0.3s ease',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                            {new Date(trip.departure_time).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </span>
                                        <span style={{ color: '#52c41a', fontSize: '18px', fontWeight: 'bold' }}>
                                            {Number(trip.price).toLocaleString()}đ
                                        </span>
                                    </div>
                                    <p style={{ color: '#aaa', marginTop: '10px' }}>
                                        <b>{trip.origin}</b> ➔ <b>{trip.destination}</b>
                                    </p>

                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* SƠ ĐỒ GHẾ */}
                <div style={{ flex: 1 }}>
                    {selectedTripId ? (
                        <SeatMap tripId={selectedTripId} onBookingSuccess={fetchTrips}
                            tripData={trips.find(t => t.id === selectedTripId)}
                        />
                    ) : !loading && trips.length > 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '100px 20px', border: '1px dashed #444',
                            borderRadius: '15px', color: '#888'
                        }}>
                            <h3>Vui lòng chọn khung giờ khởi hành</h3>
                            <p>Bạn có thể nhấn vào các chuyến xe bên trái để xem sơ đồ ghế.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;