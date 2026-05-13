import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { type Trip } from '../../types';

interface AdminTrip extends Trip {
    license_plate?: string;
}

const ManageTrips = () => {
    const [trips, setTrips] = useState<AdminTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [currentTab, setCurrentTab] = useState<'active' | 'completed'>('active');

    // --- STATE CHO CHỨC NĂNG LỌC & CHỌN NHIỀU ---
    const [filterDate, setFilterDate] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
    const [bulkPrice, setBulkPrice] = useState('');

    const [newTrip, setNewTrip] = useState({
        origin: '',
        destination: '',
        departure_time: '',
        price: ''
    });

    // Lấy thời gian hiện tại định dạng YYYY-MM-DDTHH:mm để giới hạn input
    const now = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/trips');
            setTrips(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách chuyến:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    // --- LOGIC LỌC CHUYẾN XE (KẾT HỢP TAB VÀ NGÀY) ---
    const filteredTrips = trips.filter(trip => {
        const tripDateObj = new Date(trip.departure_time);
        const currentTime = new Date().getTime();

        // 1. Lọc theo Tab
        const isCompleted = tripDateObj.getTime() < currentTime;
        const matchesTab = currentTab === 'active' ? !isCompleted : isCompleted;

        // 2. Lọc theo Ngày (So sánh chuỗi YYYY-MM-DD)
        const tripDateString = tripDateObj.toISOString().split('T')[0];
        const matchesDate = filterDate ? tripDateString === filterDate : true;

        return matchesTab && matchesDate;
    });

    // --- LOGIC CHỌN NHIỀU ---
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTrips.length && filteredTrips.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTrips.map(t => t.id));
        }
    };

    // --- XỬ LÝ HÀNG LOẠT ---
    const handleBulkUpdatePrice = async () => {
        if (!bulkPrice || isNaN(Number(bulkPrice))) return alert("Nhập giá vé hợp lệ!");
        try {
            await axiosClient.put('/trips/bulk-update-price', { ids: selectedIds, price: Number(bulkPrice) });
            alert(`Đã cập nhật giá cho ${selectedIds.length} chuyến!`);
            setSelectedIds([]);
            setShowBulkPriceModal(false);
            setBulkPrice('');
            fetchTrips();
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi khi cập nhật hàng loạt!");
        }
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Ông có chắc muốn XÓA VĨNH VIỄN ${selectedIds.length} chuyến đã chọn không?`)) {
            try {
                await axiosClient.delete('/trips/bulk-delete', { data: { ids: selectedIds } });
                alert(`Đã xóa thành công ${selectedIds.length} chuyến!`);
                setSelectedIds([]);
                fetchTrips();
            } catch (err: any) {
                alert(err.response?.data?.message || "Lỗi khi xóa hàng loạt!");
            }
        }
    };

    // --- XỬ LÝ ĐƠN LẺ ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTrip.origin || !newTrip.destination || !newTrip.departure_time || !newTrip.price) {
            alert("Vui lòng nhập đầy đủ thông tin!"); return;
        }
        try {
            if (editingId) {
                await axiosClient.put(`/trips/${editingId}`, newTrip);
                alert("Cập nhật thành công!");
            } else {
                await axiosClient.post('/trips', newTrip);
                alert("Thêm chuyến mới thành công!");
            }
            handleCancelEdit();
            fetchTrips();
        } catch (err: any) {
            alert(err.response?.data?.message || "Lỗi thao tác!");
        }
    };

    const handleEditClick = (trip: AdminTrip) => {
        setEditingId(trip.id);
        const date = new Date(trip.departure_time);
        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setNewTrip({ origin: trip.origin, destination: trip.destination, departure_time: formattedDate, price: trip.price.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewTrip({ origin: '', destination: '', departure_time: '', price: '' });
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Ông có chắc muốn xóa chuyến này không?")) {
            try {
                await axiosClient.delete(`/trips/${id}`);
                fetchTrips();
            } catch (err) { alert("Lỗi khi xóa!"); }
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '25px' }}>Quản Lý Chuyến Xe</h1>

            {/* FORM THÊM / SỬA */}
            <div style={formContainerStyle}>
                <h3 style={{ marginBottom: '15px', color: editingId ? '#faad14' : '#52c41a' }}>
                    {editingId ? `✎ Chỉnh Sửa Chuyến Xe (ID: ${editingId})` : '+ Thêm Chuyến Xe Mới'}
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Điểm đi" style={inputStyle} value={newTrip.origin} onChange={e => setNewTrip({ ...newTrip, origin: e.target.value })} />
                    <input type="text" placeholder="Điểm đến" style={inputStyle} value={newTrip.destination} onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })} />
                    <input type="datetime-local" style={inputStyle} min={now} value={newTrip.departure_time} onChange={e => setNewTrip({ ...newTrip, departure_time: e.target.value })} />
                    <input type="number" placeholder="Giá vé" style={inputStyle} value={newTrip.price} onChange={e => setNewTrip({ ...newTrip, price: e.target.value })} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ ...btnStyle, background: editingId ? '#faad14' : '#52c41a' }}>
                            {editingId ? 'Cập nhật' : 'Tạo chuyến'}
                        </button>
                        {editingId && <button type="button" onClick={handleCancelEdit} style={{ ...btnStyle, background: '#555' }}>Hủy</button>}
                    </div>
                </form>
            </div>

            {/* THANH CÔNG CỤ: TAB + LỌC NGÀY + BULK ACTIONS */}
            <div style={toolBarContainerStyle}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => { setCurrentTab('active'); setSelectedIds([]); }} style={{ ...tabBtnStyle, borderBottom: currentTab === 'active' ? '3px solid #52c41a' : '3px solid transparent', color: currentTab === 'active' ? '#52c41a' : '#888' }}> Chuyến sắp khởi hành </button>
                    <button onClick={() => { setCurrentTab('completed'); setSelectedIds([]); }} style={{ ...tabBtnStyle, borderBottom: currentTab === 'completed' ? '3px solid #faad14' : '3px solid transparent', color: currentTab === 'completed' ? '#faad14' : '#888' }}> Chuyến đã hoàn thành </button>

                    {/* BỘ LỌC NGÀY */}
                    <div style={datePickerBoxStyle}>
                        <span style={{ fontSize: '13px', color: '#ccc' }}>Lọc ngày:</span>
                        <input type="date" style={dateInputStyle} value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                        {filterDate && <button onClick={() => setFilterDate('')} style={clearDateBtnStyle}>✕</button>}
                    </div>
                </div>

                {/* BULK ACTIONS (Hiện khi có checkbox được chọn) */}
                {selectedIds.length > 0 && (
                    <div style={bulkActionBoxStyle}>
                        <span style={{ fontSize: '13px', alignSelf: 'center' }}>Đã chọn <b>{selectedIds.length}</b>:</span>
                        <button onClick={() => setShowBulkPriceModal(true)} style={{ ...bulkBtnStyle, background: '#faad14', color: '#000' }}>Sửa giá</button>
                        <button onClick={handleBulkDelete} style={{ ...bulkBtnStyle, background: '#ff4d4f', color: '#fff' }}>Xóa hết</button>
                    </div>
                )}
            </div>

            {/* BẢNG DANH SÁCH */}
            <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#333', color: '#52c41a' }}>
                            <th style={{ padding: '15px', width: '40px' }}><input type="checkbox" checked={selectedIds.length === filteredTrips.length && filteredTrips.length > 0} onChange={toggleSelectAll} /></th>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Tuyến đường</th>
                            <th style={thStyle}>Giờ khởi hành</th>
                            <th style={thStyle}>Giá vé</th>
                            <th style={thStyle}>Biển số xe</th>
                            <th style={thStyle}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>Đang tải...</td></tr>
                        ) : filteredTrips.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Không tìm thấy chuyến nào trong mục này.</td></tr>
                        ) : filteredTrips.map(trip => (
                            <tr key={trip.id} style={{ borderBottom: '1px solid #333', background: selectedIds.includes(trip.id) ? '#1a331a' : 'transparent' }}>
                                <td style={{ padding: '15px' }}><input type="checkbox" checked={selectedIds.includes(trip.id)} onChange={() => toggleSelect(trip.id)} /></td>
                                <td style={tdStyle}>{trip.id}</td>
                                <td style={tdStyle}><strong>{trip.origin} ➔ {trip.destination}</strong></td>
                                <td style={tdStyle}>{new Date(trip.departure_time).toLocaleString('vi-VN')}</td>
                                <td style={tdStyle}>{Number(trip.price).toLocaleString()}đ</td>
                                <td style={tdStyle}>{trip.license_plate ? <b style={{ color: '#52c41a' }}>🚌 {trip.license_plate}</b> : <i style={{ color: '#888' }}>Trống</i>}</td>
                                <td style={tdStyle}>
                                    {currentTab === 'active' ? (
                                        <>
                                            <button onClick={() => handleEditClick(trip)} style={actionBtnStyle('#faad14')}>Sửa</button>
                                            <button onClick={() => handleDelete(trip.id)} style={actionBtnStyle('#ff4d4f')}>Xóa</button>
                                        </>
                                    ) : <span style={{ color: '#888', fontSize: '13px' }}>Đã lưu lịch sử</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL SỬA GIÁ HÀNG LOẠT */}
            {showBulkPriceModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginBottom: '15px', color: '#52c41a' }}>Cập nhật giá vé hàng loạt</h3>
                        <p style={{ fontSize: '14px', marginBottom: '15px' }}>Đang chọn: <b>{selectedIds.length} chuyến</b></p>
                        <input type="number" placeholder="Nhập giá vé mới" style={inputStyle} value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleBulkUpdatePrice} style={{ ...btnStyle, background: '#52c41a', flex: 1 }}>Cập nhật ngay</button>
                            <button onClick={() => setShowBulkPriceModal(false)} style={{ ...btnStyle, background: '#555', flex: 1 }}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES (ĐÃ ÉP KIỂU CSSPROPERTIES) ---
const formContainerStyle: React.CSSProperties = { background: '#222', padding: '25px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #333' };
const toolBarContainerStyle: React.CSSProperties = { display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' };
const datePickerBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px', background: '#333', padding: '5px 12px', borderRadius: '8px' };
const dateInputStyle: React.CSSProperties = { padding: '5px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: '#fff', outline: 'none', cursor: 'pointer' };
const clearDateBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' };
const bulkActionBoxStyle: React.CSSProperties = { display: 'flex', gap: '8px', background: '#1a331a', padding: '8px 15px', borderRadius: '8px', border: '1px solid #52c41a' };
const bulkBtnStyle: React.CSSProperties = { border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };
const tableWrapperStyle: React.CSSProperties = { background: '#222', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { padding: '10px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { padding: '10px 25px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const tabBtnStyle: React.CSSProperties = { background: 'none', border: 'none', padding: '10px 20px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.3s' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: '#222', padding: '30px', borderRadius: '15px', border: '1px solid #444', width: '400px', textAlign: 'center' };
const actionBtnStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', marginRight: '8px' });
const thStyle: React.CSSProperties = { padding: '15px' };
const tdStyle: React.CSSProperties = { padding: '15px' };

export default ManageTrips;