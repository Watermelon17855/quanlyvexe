import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { tripId, seats, totalPrice, origin, destination, time } = location.state || {};

    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasBooked, setHasBooked] = useState(false);

    // Gộp tất cả ghế vào nội dung chuyển khoản: VEXE107A08A09
    const orderCode = `VEXE${tripId}${seats?.join('') || ''}`;

    const handleConfirmBooking = async () => {
        if (!customer.name || !customer.phone) return alert("Nhập đủ thông tin ông ơi!");

        setIsSubmitting(true);
        try {
            // 1. Gửi lệnh lưu vào DB với trạng thái PENDING
            await Promise.all(seats.map((seatNumber: string) =>
                axiosClient.post('/bookings', {
                    trip_id: tripId,
                    seat_number: seatNumber,
                    customer_name: customer.name,
                    customer_phone: customer.phone,
                    status: 'pending'
                })
            ));

            setHasBooked(true);
            alert("Đã ghi nhận yêu cầu! Ông vui lòng quét mã QR để hoàn tất thanh toán.");

        } catch (err) {
            alert("Lỗi đặt vé hoặc ghế đã có người chọn rồi!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tripId) return <div style={{ color: '#fff', padding: '20px' }}>Dữ liệu không hợp lệ!</div>;

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                {/* Form nhập liệu */}
                <div style={leftSection}>
                    <button onClick={() => navigate(-1)} style={backBtnStyle}>← Quay lại</button>
                    <h2 style={{ color: '#52c41a', marginBottom: '20px' }}>Thông Tin Hành Khách</h2>

                    <div style={routeInfoBox}>
                        <p>Tuyến: <b>{origin} ➔ {destination}</b></p>
                        <p>Ghế: <b style={{ color: '#faad14' }}>{seats?.join(', ')}</b></p>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <input
                            style={inputStyle}
                            placeholder="Họ tên"
                            value={customer.name}
                            onChange={e => setCustomer({ ...customer, name: e.target.value })}
                            disabled={hasBooked}
                        />
                        <input
                            style={{ ...inputStyle, marginTop: '10px' }}
                            placeholder="Số điện thoại"
                            value={customer.phone}
                            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                            disabled={hasBooked}
                        />
                    </div>

                    <button
                        onClick={handleConfirmBooking}
                        disabled={isSubmitting || hasBooked}
                        style={{ ...btnStyle, background: (isSubmitting || hasBooked) ? '#444' : '#52c41a' }}
                    >
                        {hasBooked ? 'ĐANG CHỜ THANH TOÁN...' : 'XÁC NHẬN ĐẶT VÉ'}
                    </button>
                </div>

                {/* Phần QR Code */}
                <div style={rightSection}>
                    <h3>Quét QR để xác nhận vé</h3>
                    <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', marginTop: '20px' }}>
                        <img
                            src={`https://qr.sepay.vn/img?acc=0388100173&bank=VPBank&amount=${totalPrice}&des=${orderCode}`}
                            alt="QR"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={memoSummary}>
                        <p>Tổng tiền: <b style={{ color: '#52c41a' }}>{totalPrice?.toLocaleString()}đ</b></p>
                        <p>Nội dung: <b style={{ color: '#faad14' }}>{orderCode}</b></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Styles (giữ nguyên của ông cho Dark Mode)
const containerStyle: any = { background: '#111', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const cardStyle: any = { background: '#1a1a1a', display: 'flex', borderRadius: '20px', border: '1px solid #333', maxWidth: '900px', width: '100%' };
const leftSection: any = { flex: 1.2, padding: '40px', color: '#fff' };
const rightSection: any = { flex: 1, padding: '40px', background: '#222', color: '#fff', borderLeft: '1px solid #333' };
const routeInfoBox: any = { background: '#222', padding: '15px', borderRadius: '10px' };
const inputStyle: any = { width: '100%', padding: '12px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '8px' };
const btnStyle: any = { width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px' };
const memoSummary: any = { marginTop: '20px', background: '#111', padding: '15px', borderRadius: '10px' };
const backBtnStyle: any = { background: 'none', border: 'none', color: '#666', cursor: 'pointer' };

export default CheckoutPage;