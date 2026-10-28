import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", // đổi theo địa chỉ BE
  headers: { "Content-Type": "application/json" },
});

// gắn token vào mọi request (token do trang đăng nhập của Huy lưu)
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
