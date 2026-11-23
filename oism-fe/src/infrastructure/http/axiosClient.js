import axios from 'axios';
import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Bearer Token trước khi gửi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi chung khi Backend trả về
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;