import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div style={{
            width: '250px', background: '#222', minHeight: '100vh',
            padding: '20px', borderRight: '1px solid #333'
        }}>
            <h2 style={{ color: '#52c41a', marginBottom: '30px' }}>ADMIN PANEL</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={liStyle}><Link to="/admin" style={linkStyle}>📊 Dashboard</Link></li>
                <li style={liStyle}><Link to="/admin/trips" style={linkStyle}>🚌 Quản lý chuyến xe</Link></li>
                <li style={liStyle}><Link to="/admin/bookings" style={linkStyle}>🎫 Quản lý đặt vé</Link></li>
                <li style={liStyle}><Link to="/admin/vehicles" style={linkStyle}>🚌 Quản lý đội xe</Link></li>
            </ul>
        </div>
    );
};

const liStyle = { marginBottom: '15px' };
const linkStyle = { color: '#fff', textDecoration: 'none', fontSize: '18px' };

export default Sidebar;