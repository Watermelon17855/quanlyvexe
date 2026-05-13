import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axiosClient from '../../api/axiosClient';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Nhận data từ SeatMap truyền sang
    const { tripId, seats, totalPrice, origin, destination, time } = location.state || {};

    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cú pháp nội dung chuyển khoản để SePay Webhook quét được
    // Ví dụ: VEXE98A01 (Viết liền không dấu để tránh lỗi Regex ở BE)
    const orderCode = `VEXE${tripId}${seats?.join('')}`;

    const handleConfirmBooking = async () => {
        if (!customer.name || !customer.phone) return alert("Nhập đủ thông tin ông ơi!");

        setIsSubmitting(true);
        try {
            // Lưu từng ghế vào DB với trạng thái pending
            await Promise.all(seats.map((seatNumber: string) =>
                axiosClient.post('/bookings', {
                    trip_id: tripId,
                    seat_number: seatNumber,
                    customer_name: customer.name,
                    customer_phone: customer.phone,
                    status: 'pending'
                })
            ));
            alert("Đã ghi nhận! Ông quét mã thanh toán, tiền vào là vé tự xác nhận nhé.");
        } catch (err) {
            alert("Lỗi đặt vé hoặc ghế đã có người chọn mất rồi!");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tripId) return <div style={{ color: '#fff', padding: '20px' }}>Không có dữ liệu thanh toán!</div>;

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>

                {/* BÊN TRÁI: FORM THÔNG TIN */}
                <div style={leftSection}>
                    <button onClick={() => navigate(-1)} style={backBtnStyle}>← Quay lại</button>
                    <h2 style={{ color: '#52c41a', marginBottom: '20px' }}>Thông Tin Hành Khách</h2>

                    <div style={routeInfoBox}>
                        <p style={{ margin: '5px 0' }}>Tuyến: <b>{origin} ➔ {destination}</b></p>
                        <p style={{ margin: '5px 0' }}>Khởi hành: <b>{time}</b></p>
                        <p style={{ margin: '5px 0' }}>Ghế: <b style={{ color: '#faad14' }}>{seats?.join(', ')}</b></p>
                    </div>

                    <div style={{ marginTop: '25px' }}>
                        <div style={inputGroup}>
                            <label style={labelStyle}>Họ tên khách đi</label>
                            <input
                                style={inputStyle}
                                value={customer.name}
                                onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                placeholder="VD: Nguyễn Văn A"
                            />
                        </div>
                        <div style={inputGroup}>
                            <label style={labelStyle}>Số điện thoại</label>
                            <input
                                style={inputStyle}
                                value={customer.phone}
                                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                placeholder="VD: 090xxxxxxx"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleConfirmBooking}
                        disabled={isSubmitting}
                        style={{ ...btnStyle, background: isSubmitting ? '#444' : '#52c41a' }}
                    >
                        {isSubmitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT VÉ'}
                    </button>
                </div>

                {/* BÊN PHẢI: QUÉT MÃ QR SEPAY */}
                <div style={rightSection}>
                    <h3 style={{ marginBottom: '10px' }}>Quét Mã QR Thanh Toán</h3>
                    <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '20px' }}>Tự động xác nhận sau 30 giây</p>

                    {/* THẺ QR SEPAY CỦA ÔNG ĐÂY */}
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 mb-8 relative group" style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
                        <img
                            src={`https://qr.sepay.vn/img?acc=104876586342&bank=VietinBank&amount=${totalPrice}&des=${orderCode}`}
                            alt="QR Thanh toán"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>

                    <div style={memoSummary}>
                        <p style={{ fontSize: '14px', color: '#888' }}>Số tiền cần trả:</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>{totalPrice?.toLocaleString()}đ</p>
                        <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>Nội dung chuyển khoản:</p>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>{orderCode}</p>
                    </div>

                    <p style={{ fontSize: '12px', color: '#666', marginTop: '20px', fontStyle: 'italic' }}>
                        * Vui lòng không chỉnh sửa nội dung chuyển khoản để hệ thống nhận diện hóa đơn tự động.
                    </p>
                </div>

            </div>
        </div>
    );
};

// --- STYLES (Giữ nguyên phong cách Dark Mode của ông) ---
const containerStyle: React.CSSProperties = { background: '#111', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const cardStyle: React.CSSProperties = { background: '#1a1a1a', display: 'flex', borderRadius: '24px', overflow: 'hidden', border: '1px solid #333', maxWidth: '1000px', width: '100%' };
const leftSection: React.CSSProperties = { flex: 1.2, padding: '40px', borderRight: '1px solid #333', color: '#fff' };
const rightSection: React.CSSProperties = { flex: 1, padding: '40px', background: '#222', textAlign: 'center', color: '#fff' };
const routeInfoBox: React.CSSProperties = { background: '#222', padding: '15px', borderRadius: '12px', border: '1px solid #333' };
const inputGroup: React.CSSProperties = { marginBottom: '15px' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', background: '#111', border: '1px solid #444', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '16px', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px', fontSize: '16px' };
const memoSummary: React.CSSProperties = { marginTop: '15px', background: '#111', padding: '15px', borderRadius: '12px' };
const backBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '10px', padding: '0' };

export default CheckoutPage;