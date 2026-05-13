import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

interface Booking {
    id: number;
    customer_name: string;
    customer_phone: string;
    origin: string;
    destination: string;
    departure_time: string;
    seat_number: string;
    booking_date: string;
    status: string;
    trip_id: number;
}

interface Trip {
    id: number;
    origin: string;
    destination: string;
    departure_time: string;
}

const ManageBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Tab State: 'active' cho vé sắp đi, 'history' cho vé đã hoàn thành
    const [currentTab, setCurrentTab] = useState<'active' | 'history'>('active');

    const [showModal, setShowModal] = useState<'transfer' | 'add' | null>(null);
    const [targetBookingId, setTargetBookingId] = useState<number | null>(null);

    const [selectedTripId, setSelectedTripId] = useState('');
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });

    const lowerSeats = Array.from({ length: 15 }, (_, i) => `A${(i + 1).toString().padStart(2, '0')}`);
    const upperSeats = Array.from({ length: 15 }, (_, i) => `B${(i + 1).toString().padStart(2, '0')}`);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resB, resT] = await Promise.all([
                axiosClient.get('/bookings'),
                axiosClient.get('/trips')
            ]);
            setBookings(resB.data.filter((b: Booking) => b.status !== 'cancelled'));
            setTrips(resT.data);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredBookings = bookings.filter(b => {
        const now = new Date();
        const departure = new Date(b.departure_time);
        const isCompleted = departure < now;
        const matchesTab = currentTab === 'active' ? !isCompleted : isCompleted;
        const matchesSearch = b.customer_phone.includes(searchTerm) ||
            b.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const handleTripChange = async (tripId: string) => {
        setSelectedTripId(tripId);
        setSelectedSeats([]);
        if (tripId) {
            try {
                const res = await axiosClient.get(`/trips/${tripId}/booked-seats`);
                setBookedSeats(res.data);
            } catch (err) {
                console.error("Lỗi lấy ghế:", err);
            }
        }
    };

    const toggleSeat = (seat: string) => {
        if (selectedSeats.includes(seat)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seat));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    const handleAction = async () => {
        try {
            if (selectedSeats.length === 0) {
                alert("Vui lòng chọn ít nhất một ghế!"); return;
            }

            if (showModal === 'add') {
                if (!customerInfo.name || !customerInfo.phone || !selectedTripId) {
                    alert("Vui lòng nhập đầy đủ thông tin khách hàng!"); return;
                }
                await Promise.all(selectedSeats.map(seat =>
                    axiosClient.post('/bookings', {
                        trip_id: selectedTripId,
                        customer_name: customerInfo.name,
                        customer_phone: customerInfo.phone,
                        seat_number: seat
                    })
                ));
                alert(`Đã đặt thành công ${selectedSeats.length} vé!`);
            } else if (showModal === 'transfer') {
                if (selectedSeats.length > 1) {
                    alert("Chỉ được chọn 1 ghế mới khi chuyển vé đơn lẻ!"); return;
                }
                await axiosClient.put(`/bookings/transfer/${targetBookingId}`, {
                    new_trip_id: selectedTripId,
                    new_seat_number: selectedSeats[0]
                });
                alert("Chuyển vé thành công!");
            }
            closeModal();
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || "Có lỗi xảy ra!");
        }
    };

    const closeModal = () => {
        setShowModal(null);
        setTargetBookingId(null);
        setSelectedTripId('');
        setSelectedSeats([]);
        setCustomerInfo({ name: '', phone: '' });
    };

    const SeatMap = ({ seats, title }: { seats: string[], title: string }) => (
        <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', color: '#52c41a', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' }}>{title}</p>
            <div style={seatGridStyle}>
                {seats.map(seat => {
                    const isBooked = bookedSeats.includes(seat);
                    const isSelected = selectedSeats.includes(seat);
                    return (
                        <div
                            key={seat}
                            onClick={() => !isBooked && toggleSeat(seat)}
                            style={{
                                ...seatItemStyle,
                                backgroundColor: isBooked ? '#333' : isSelected ? '#52c41a' : '#222',
                                color: isBooked ? '#666' : isSelected ? '#000' : '#fff',
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                border: isSelected ? '2px solid #fff' : '1px solid #444',
                            }}
                        >
                            {seat}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h1>Quản Lý Đặt Vé</h1>
                <button onClick={() => setShowModal('add')} style={btnHeaderStyle}>
                    + Đặt vé nhanh (Tại quầy)
                </button>
            </div>

            {/* TAB SELECTOR - ĐÃ CẬP NHẬT GIỐNG QUẢN LÝ CHUYẾN XE */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setCurrentTab('active')}
                    style={{
                        ...tabBtnStyle,
                        borderBottom: currentTab === 'active' ? '3px solid #52c41a' : '3px solid transparent',
                        color: currentTab === 'active' ? '#52c41a' : '#888'
                    }}
                >
                    Vé đang hoạt động
                </button>
                <button
                    onClick={() => setCurrentTab('history')}
                    style={{
                        ...tabBtnStyle,
                        borderBottom: currentTab === 'history' ? '3px solid #faad14' : '3px solid transparent',
                        color: currentTab === 'history' ? '#faad14' : '#888'
                    }}
                >
                    Lịch sử vé (Đã đi)
                </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text" placeholder="Tìm SĐT hoặc tên khách..."
                    style={searchInputStyle} value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ background: '#222', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#333', color: '#52c41a' }}>
                            <th style={thStyle}>Khách hàng</th>
                            <th style={thStyle}>SĐT</th>
                            <th style={thStyle}>Chuyến</th>
                            <th style={thStyle}>Ghế</th>
                            <th style={thStyle}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                        ) : filteredBookings.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Không có dữ liệu ở mục này.</td></tr>
                        ) : filteredBookings.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #333', opacity: currentTab === 'history' ? 0.8 : 1 }}>
                                <td style={tdStyle}><b>{b.customer_name}</b></td>
                                <td style={tdStyle}>{b.customer_phone}</td>
                                <td style={tdStyle}>
                                    {b.origin} ➔ {b.destination}
                                    <div style={{ fontSize: '11px', color: '#888' }}>{new Date(b.departure_time).toLocaleString('vi-VN')}</div>
                                </td>
                                <td style={tdStyle}><span style={seatBox}>{b.seat_number}</span></td>
                                <td style={tdStyle}>
                                    {currentTab === 'active' ? (
                                        <>
                                            <button onClick={() => { setTargetBookingId(b.id); setShowModal('transfer'); }} style={btnTransferStyle}>Chuyển</button>
                                            <button onClick={() => { if (window.confirm("Hủy vé?")) axiosClient.put(`/bookings/cancel/${b.id}`).then(() => fetchData()) }} style={btnCancelStyle}>Hủy</button>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#888' }}>Hoàn thành</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, width: '650px' }}>
                        <h2 style={{ color: '#52c41a', marginBottom: '15px' }}>
                            {showModal === 'add' ? 'Đặt Vé Mới (Chọn nhiều ghế)' : 'Chuyển Chuyến Xe'}
                        </h2>

                        {showModal === 'add' && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <input
                                    type="text" placeholder="Tên khách" style={inputStyle}
                                    value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                />
                                <input
                                    type="text" placeholder="SĐT khách" style={inputStyle}
                                    value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                />
                            </div>
                        )}

                        <label style={labelStyle}>Chọn chuyến đi:</label>
                        <select style={inputStyle} value={selectedTripId} onChange={(e) => handleTripChange(e.target.value)}>
                            <option value="">-- Chọn chuyến --</option>
                            {trips.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.origin} ➔ {t.destination} ({new Date(t.departure_time).toLocaleString('vi-VN')})
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                            {selectedTripId ? (
                                <>
                                    <SeatMap seats={lowerSeats} title="Tầng Dưới (A)" />
                                    <SeatMap seats={upperSeats} title="Tầng Trên (B)" />
                                </>
                            ) : (
                                <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#888', background: '#111', borderRadius: '8px' }}>
                                    Chọn chuyến để xem sơ đồ
                                </div>
                            )}
                        </div>

                        {selectedSeats.length > 0 && (
                            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                <p style={{ color: '#888', fontSize: '13px' }}>Ghế chọn ({selectedSeats.length}): {selectedSeats.join(', ')}</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleAction} style={btnConfirmStyle}>Xác nhận</button>
                            <button onClick={closeModal} style={btnCancelModalStyle}>Hủy bỏ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const tabBtnStyle = { background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.3s' };
const seatGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#111', padding: '12px', borderRadius: '8px' };
const seatItemStyle: React.CSSProperties = { padding: '12px 0', textAlign: 'center', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', transition: '0.2s' };
const thStyle = { padding: '15px' };
const tdStyle = { padding: '15px' };
const searchInputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', width: '300px', outline: 'none' };
const seatBox = { background: '#52c41a', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' as const };
const btnTransferStyle = { background: '#1890ff', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' };
const btnCancelStyle = { background: '#ff4d4f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' };
const btnHeaderStyle = { background: '#52c41a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: '#1a1a1a', padding: '25px', borderRadius: '12px', border: '1px solid #333' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#222', color: '#fff' };
const labelStyle = { display: 'block', marginBottom: '8px', marginTop: '15px', color: '#ccc', fontSize: '14px' };
const btnConfirmStyle = { flex: 1, padding: '12px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancelModalStyle = { flex: 1, padding: '12px', background: '#444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };

export default ManageBookings;