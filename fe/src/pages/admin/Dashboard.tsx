// fe/src/pages/admin/Dashboard.tsx

const Dashboard = () => {
    return (
        // Bỏ thẻ div flex bọc ngoài và Sidebar đi
        <div>
            <h1>Dashboard Tổng Quan</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>
                <div style={cardStyle}>
                    <h3>Tổng Chuyến Xe</h3>
                    <p style={{ fontSize: '30px', color: '#52c41a' }}>12</p>
                </div>
                <div style={cardStyle}>
                    <h3>Vé Đã Bán</h3>
                    <p style={{ fontSize: '30px', color: '#1890ff' }}>45</p>
                </div>
                <div style={cardStyle}>
                    <h3>Doanh Thu</h3>
                    <p style={{ fontSize: '30px', color: '#faad14' }}>13.500.000đ</p>
                </div>
            </div>
        </div>
    );
};

const cardStyle = {
    background: '#262626',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center' as const,
    border: '1px solid #333' // Thêm viền nhẹ cho đẹp
};

export default Dashboard;