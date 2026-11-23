import axiosClient from "@/infrastructure/http/axiosClient";

export const authApi = {
  // Đăng nhập người dùng / nhân viên
  login: (credentials) => {
    return axiosClient.post("/auth/login", credentials);
  },

  // Đăng nhập riêng trang Quản trị viên
  adminLogin: (credentials) => {
    return axiosClient.post("/auth/admin-login", credentials);
  },

  // Đăng ký tài khoản cửa hàng / nhân sự
  register: (userData) => {
    return axiosClient.post("/auth/register", userData);
  },

  // Quên mật khẩu / Đặt lại mật khẩu
  forgotPassword: (payload) => {
    return axiosClient.post("/auth/forgot-password", payload);
  },

  // Đổi mật khẩu (dùng cho ChangePasswordModal)
  changePassword: (payload) => {
    return axiosClient.post("/auth/change-password", payload);
  },

  // Quản lý nhân viên & phân quyền (dùng cho StaffPage)
  getStaffList: () => axiosClient.get("/users"),
  createStaff: (data) => axiosClient.post("/users", data),
  updateStaff: (id, data) => axiosClient.put(`/users/${id}`, data),
  toggleStaffStatus: (id) => axiosClient.patch(`/users/${id}/status`),
};

export default authApi;