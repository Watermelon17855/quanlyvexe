import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:3036/api', // Thay đúng port BE của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;