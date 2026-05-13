// App.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/client/HomePage';
import BookingPage from './pages/client/BookingPage';
import CheckoutPage from './pages/client/CheckoutPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ManageTrips from './pages/admin/ManageTrips';
import ManageBookings from './pages/admin/ManageBookings';
import ManageVehicles from './pages/admin/ManageVehicles';

function App() {
  return (
    <Routes>
      {/* LUỒNG CLIENT */}
      <Route path="/" element={<HomePage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* LUỒNG ADMIN */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="trips" element={<ManageTrips />} />
        <Route path="bookings" element={<ManageBookings />} />
        <Route path="vehicles" element={<ManageVehicles />} />
      </Route>
    </Routes>
  );
}

export default App;