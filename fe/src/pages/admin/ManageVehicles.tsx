import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

interface Vehicle {
    id: number;
    license_plate: string;
    status: 'Ready' | 'On Road' | 'Maintenance';
    current_station: string;
    estimated_ready_time: string;
}

// Danh sách các bến xe cố định để đồng bộ dữ liệu
const STATIONS = ['Sài Gòn', 'Khánh Hòa', 'Ninh Thuận'];

const ManageVehicles = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        license_plate: '',
        current_station: STATIONS[0]
    });

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/vehicles');
            setVehicles(res.data);
        } catch (err) {
            console.error("Lỗi lấy danh sách xe:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Hàm thêm xe mới
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.license_plate) return alert("Nhập biển số xe ông ơi!");

        try {
            await axiosClient.post('/vehicles', form);
            alert("Đã thêm xe mới vào đội!");
            setForm({ ...form, license_plate: '' });
            fetchVehicles();
        } catch (err) {
            alert("Lỗi khi thêm xe (có thể trùng biển số)");
        }
    };

    // Hàm cập nhật vị trí xe nhanh
    const handleUpdateLocation = async (id: number, newStation: string) => {
        try {
            await axiosClient.put(`/vehicles/${id}/location`, { current_station: newStation });
            setVehicles(prev => prev.map(v => v.id === id ? { ...v, current_station: newStation } : v));
            alert("Đã cập nhật vị trí xe thành công!");
        } catch (err) {
            alert("Lỗi khi cập nhật vị trí xe!");
            fetchVehicles();
        }
    };

    // --- HÀM XÓA XE MỚI THÊM ---
    const handleDeleteVehicle = async (id: number) => {
        if (window.confirm("Ông có chắc muốn xóa xe này khỏi đội không?")) {
            try {
                await axiosClient.delete(`/vehicles/${id}`);
                alert("Đã xóa xe thành công!");
                fetchVehicles();
            } catch (err: any) {
                // Backend sẽ trả về lỗi nếu xe đang có chuyến gán (Foreign Key)
                alert(err.response?.data?.message || "Lỗi khi xóa xe!");
            }
        }
    };

    return (
        <div style={{ color: '#fff' }}>
            <h1 style={{ marginBottom: '25px' }}>🚌 Quản Lý Đội Xe</h1>

            {/* Form thêm xe */}
            <div style={formContainerStyle}>
                <h3 style={{ marginBottom: '15px', color: '#52c41a' }}>+ Nhập Xe Mới</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px' }}>
                    <input
                        placeholder="Biển số (Vd: 51B-123.45)"
                        style={inputStyle}
                        value={form.license_plate}
                        onChange={e => setForm({ ...form, license_plate: e.target.value })}
                    />
                    <select
                        style={inputStyle}
                        value={form.current_station}
                        onChange={e => setForm({ ...form, current_station: e.target.value })}
                    >
                        {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="submit" style={btnStyle}>Thêm vào đội</button>
                </form>
            </div>

            {/* Bảng danh sách xe */}
            <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#333', color: '#52c41a' }}>
                            <th style={thStyle}>Biển số</th>
                            <th style={thStyle}>Vị trí hiện tại (Click để đổi)</th>
                            <th style={thStyle}>Trạng thái</th>
                            <th style={thStyle}>Sẵn sàng lúc</th>
                            <th style={thStyle}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                        ) : vehicles.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Chưa có xe nào trong đội.</td></tr>
                        ) : vehicles.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={tdStyle}><b>{v.license_plate}</b></td>
                                <td style={tdStyle}>
                                    <select
                                        value={v.current_station}
                                        onChange={(e) => handleUpdateLocation(v.id, e.target.value)}
                                        style={selectInlineStyle}
                                    >
                                        {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                        background: v.status === 'Ready' ? '#135200' : '#874d00',
                                        color: v.status === 'Ready' ? '#b7eb8f' : '#fffbe6'
                                    }}>
                                        {v.status === 'Ready' ? 'Sẵn sàng' : 'Đang chạy'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    {v.status === 'Ready' ? 'Ngay bây giờ' : new Date(v.estimated_ready_time).toLocaleString('vi-VN')}
                                </td>
                                <td style={tdStyle}>
                                    <button
                                        onClick={() => handleDeleteVehicle(v.id)}
                                        style={deleteBtnStyle}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- STYLES (Đã ép kiểu CSSProperties để fix lỗi boxSizing) ---
const formContainerStyle: React.CSSProperties = {
    background: '#222',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    border: '1px solid #333'
};

const tableWrapperStyle: React.CSSProperties = {
    background: '#222',
    borderRadius: '12px',
    border: '1px solid #333',
    overflow: 'hidden'
};

const inputStyle: React.CSSProperties = {
    padding: '10px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box' as 'border-box'
};

const selectInlineStyle: React.CSSProperties = {
    background: '#1a1a1a',
    color: '#52c41a',
    border: '1px solid #444',
    padding: '6px 10px',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const btnStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: '#52c41a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const deleteBtnStyle: React.CSSProperties = {
    background: '#ff4d4f',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px'
};

const thStyle: React.CSSProperties = { padding: '15px' };
const tdStyle: React.CSSProperties = { padding: '15px' };

export default ManageVehicles;