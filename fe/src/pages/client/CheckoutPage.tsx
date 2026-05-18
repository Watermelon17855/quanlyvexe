import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { tripId, seats, totalPrice, origin, destination, time } = location.state || {};

    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasBooked, setHasBooked] = useState(false);
    const [isPaid, setIsPaid] = useState(false); // Trạng thái dùng để hiển thị giao diện khi thanh toán xong

    // Gộp tất cả ghế vào nội dung chuyển khoản: VEXE107A08A09
    const orderCode = `VEXE${tripId}${seats?.join('') || ''}`;

    // --- EFFECT CHẠY POLLING KIỂM TRA TRẠNG THÁI THANH TOÁN ---
    useEffect(() => {
        let intervalId: any;

        if (hasBooked && !isPaid) {
            // Cứ mỗi 3 giây gọi API checkStatus một lần
            intervalId = setInterval(async () => {
                try {
                    // Truyền trip_id và seat_number đầu tiên lên (hoặc kiểm tra đồng loạt tùy logic của ông)
                    const response = await axiosClient.get('/bookings/check-status', {
                        params: {
                            trip_id: tripId,
                            seat_number: seats[0]
                        }
                    });

                    // Nếu Backend trả về confirmed: true
                    if (response.data.confirmed) {
                        clearInterval(intervalId); // Dừng quét ngay lập tức
                        setIsPaid(true); // Cập nhật state để đổi giao diện thành công
                        alert("🎉 Thanh toán thành công! Vé của ông đã được hệ thống tự động xác nhận.");
                    }
                } catch (error) {
                    console.error("Đang đợi đồng bộ số dư từ SePay...", error);
                }
            }, 3000); // 3000ms = 3 giây
        }

        // Clean up interval khi component unmount hoặc trạng thái thay đổi
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [hasBooked, isPaid, tripId, seats]);

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
                    <h2 style={{ color: isPaid ? '#52c41a' : '#faad14', marginBottom: '20px' }}>
                        {isPaid ? 'Đặt Vé Thành Công 🎉' : 'Thông Tin Hành Khách'}
                    </h2>

                    <div style={routeInfoBox}>
                        <p>Tuyến: <b>{origin} ➔ {destination}</b></p>
                        <p>Khởi hành: <b>{time}</b></p>
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

                    {/* Thay đổi nút bấm tùy thuộc vào trạng thái thanh toán */}
                    {isPaid ? (
                        <button
                            onClick={() => navigate('/')} // Chuyển hướng về trang chủ hoặc trang danh sách vé
                            style={{ ...btnStyle, background: '#52c41a', color: '#fff' }}
                        >
                            VỀ TRANG CHỦ Xem VÉ ĐÃ ĐẶT
                        </button>
                    ) : (
                        <button
                            onClick={handleConfirmBooking}
                            disabled={isSubmitting || hasBooked}
                            style={{ ...btnStyle, background: (isSubmitting || hasBooked) ? '#444' : '#52c41a' }}
                        >
                            {hasBooked ? '⏳ ĐANG CHỜ QUÉT MÃ...' : 'XÁC NHẬN ĐẶT VÉ'}
                        </button>
                    )}
                </div>

                {/* Phần QR Code */}
                <div style={rightSection}>
                    {isPaid ? (
                        <div style={successBoxStyle}>
                            <div style={{ fontSize: '64px' }}>✅</div>
                            <h3 style={{ color: '#52c41a', marginTop: '10px' }}>HỆ THỐNG ĐÃ NHẬN TIỀN</h3>
                            <p style={{ color: '#aaa', fontSize: '14px', marginTop: '5px' }}>Vé của ông đã được kích hoạt thành công trên hệ thống tự động.</p>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Styles (Giữ nguyên phong cách Dark Mode của ông và bổ sung nhẹ box success)
const containerStyle: any = { background: '#111', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const cardStyle: any = { background: '#1a1a1a', display: 'flex', borderRadius: '20px', border: '1px solid #333', maxWidth: '900px', width: '100%' };
const leftSection: any = { flex: 1.2, padding: '40px', color: '#fff' };
const rightSection: any = { flex: 1, padding: '40px', background: '#222', color: '#fff', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const routeInfoBox: any = { background: '#222', padding: '15px', borderRadius: '10px' };
const inputStyle: any = { width: '100%', padding: '12px', background: '#111', border: '1px solid #444', color: '#fff', borderRadius: '8px' };
const btnStyle: any = { width: '100%', padding: '15px', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', border: 'none' };
const memoSummary: any = { marginTop: '20px', background: '#111', padding: '15px', borderRadius: '10px' };
const backBtnStyle: any = { background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginBottom: '10px' };
const successBoxStyle: any = { textAlign: 'center', padding: '20px' };

export default CheckoutPage;