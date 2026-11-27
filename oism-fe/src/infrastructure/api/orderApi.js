import axiosClient from "@/infrastructure/http/axiosClient";

// Các API đơn hàng của backend (xem routes/orderRoutes.js)
export const orderApi = {
  // Lấy danh sách đơn hàng của cửa hàng
  getOrders: () => axiosClient.get("/orders"),

  // Tạo đơn mới (bắt buộc có code)
  createOrder: (data) => axiosClient.post("/orders", data),

  // Đổi trạng thái: DRAFT, RESERVED, CONFIRMED, COMPLETED, CANCELLED
  updateStatus: (id, status) =>
    axiosClient.patch(`/orders/${id}/status`, { status }),

  // Giả lập đơn từ Shopee/TikTok
  simulateWebhook: (data) => axiosClient.post("/orders/webhook-simulate", data),
};

export default orderApi;