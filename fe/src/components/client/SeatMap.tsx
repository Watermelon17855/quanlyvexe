import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm để điều hướng
import axiosClient from '../../api/axiosClient';

interface Props {
    tripId: number;
    onBookingSuccess: () => void;
    // Bổ sung thêm các thông tin chuyến xe để truyền sang Checkout
    tripData?: {
        origin: string;
        destination: string;
        price: number;
        departure_time: string;
    };
}

const SeatMap: React.FC<Props> = ({ tripId, onBookingSuccess, tripData }) => {
    const navigate = useNavigate();
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const floorA = Array.from({ length: 15 }, (_, i) => `A${(i + 1).toString().padStart(2, '0')}`);
    const floorB = Array.from({ length: 15 }, (_, i) => `B${(i + 1).toString().padStart(2, '0')}`);

    const fetchBookedSeats = async () => {
        try {
            const res = await axiosClient.get(`/trips/${tripId}/booked-seats`);
            setBookedSeats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBookedSeats();
        setSelectedSeats([]);
    }, [tripId]);

    const toggleSeat = (seatCode: string) => {
        if (selectedSeats.includes(seatCode)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
        } else {
            setSelectedSeats([...selectedSeats, seatCode]);
        }
    };

    // --- HÀM XỬ LÝ CHUYỂN SANG TRANG CHECKOUT ---
    const goToCheckout = () => {
        if (selectedSeats.length === 0) return;

        // Tính tổng tiền dựa trên số ghế chọn
        const totalPrice = (tripData?.price || 0) * selectedSeats.length;

        navigate('/checkout', {
            state: {
                tripId: tripId,
                seats: selectedSeats, // Truyền mảng ghế
                totalPrice: totalPrice,
                origin: tripData?.origin,
                destination: tripData?.destination,
                time: tripData?.departure_time
            }
        });
    };

    const renderFloor = (title: string, seats: string[]) => (
        <div style={{ flex: 1, textAlign: 'center' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#888' }}>{title}</h4>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                padding: '10px',
                background: '#1a1a1a',
                borderRadius: '8px'
            }}>
                {seats.map(seat => {
                    const isBooked = bookedSeats.includes(seat);
                    const isSelected = selectedSeats.includes(seat);
                    return (
                        <button
                            key={seat}
                            disabled={isBooked}
                            onClick={() => toggleSeat(seat)}
                            style={{
                                padding: '10px 0',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: isBooked ? '#444' : isSelected ? '#52c41a' : '#222',
                                color: isSelected ? '#000' : '#fff',
                                border: isSelected ? '2px solid #fff' : '1px solid #444',
                                borderRadius: '6px',
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {seat}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{ border: '1px solid #444', padding: '20px', borderRadius: '12px', background: '#222', color: '#fff' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#52c41a' }}>Sơ đồ ghế giường nằm</h3>

            <div style={{ display: 'flex', gap: '20px' }}>
                {renderFloor("Tầng Dưới (A)", floorA)}
                {renderFloor("Tầng Trên (B)", floorB)}
            </div>

            {/* Phần hiển thị tóm tắt và nút chuyển trang */}
            <div style={{ marginTop: '25px', padding: '15px', background: '#1a1a1a', borderRadius: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                    Ghế đã chọn: {selectedSeats.length > 0 ? <b style={{ color: '#fff' }}>{selectedSeats.join(', ')}</b> : <i>Chưa chọn ghế</i>}
                </p>

                {selectedSeats.length > 0 && (
                    <div style={{ marginBottom: '15px', fontSize: '16px' }}>
                        Tổng tiền: <b style={{ color: '#52c41a' }}>{((tripData?.price || 0) * selectedSeats.length).toLocaleString()}đ</b>
                    </div>
                )}

                <button
                    onClick={goToCheckout}
                    disabled={selectedSeats.length === 0}
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: selectedSeats.length > 0 ? '#52c41a' : '#444',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '16px'
                    }}
                >
                    TIẾP TỤC THANH TOÁN ({selectedSeats.length} VÉ)
                </button>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '12px', color: '#888' }}>
                <span><span style={{ color: '#222', border: '1px solid #444', padding: '0 5px', marginRight: '5px' }}>■</span> Trống</span>
                <span><span style={{ color: '#52c41a', marginRight: '5px' }}>■</span> Đang chọn</span>
                <span><span style={{ color: '#444', marginRight: '5px' }}>■</span> Đã đặt</span>
            </div>
        </div>
    );
};

export default SeatMap;