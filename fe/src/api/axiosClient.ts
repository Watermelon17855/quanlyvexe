import axios from 'axios';

const axiosClient = axios.create({
    // Nếu có biến môi trường VITE_API_URL thì dùng, không thì mặc định là localhost
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3036') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;