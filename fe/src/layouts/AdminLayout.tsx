import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#1a1a1a' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '30px', color: '#fff', overflowY: 'auto' }}>
                {/* Nội dung các trang Dashboard, ManageTrips... sẽ thay thế vào đây */}
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;