import axiosClient from "@/infrastructure/http/axiosClient";

const inventoryApi = {
  // ==========================================
  // 1. BRANCHES - CHI NHÁNH / KHO
  // ==========================================

  getBranches: () =>
    axiosClient.get("/branches"),

  createBranch: (data) =>
    axiosClient.post("/branches", data),

  toggleBranchActive: (id, value) =>
    axiosClient.patch(`/branches/${id}/active`, null, {
      params: { value },
    }),

  // ==========================================
  // 2. SUPPLIERS - NHÀ CUNG CẤP
  // ==========================================

  getSuppliers: () =>
    axiosClient.get("/suppliers"),

  createSupplier: (data) =>
    axiosClient.post("/suppliers", data),

  updateSupplier: (id, data) =>
    axiosClient.put(`/suppliers/${id}`, data),

  // ==========================================
  // 3. VARIANTS / SKU
  // ==========================================

  getVariants: (params = {}) =>
    axiosClient.get("/variants/search", { params }),

  // ==========================================
  // 4. PURCHASE RECEIPTS - PHIẾU NHẬP
  // ==========================================

  getPurchaseReceipts: (params = {}) =>
    axiosClient.get("/purchase-receipts", { params }),

  getPurchaseReceiptById: (id) =>
    axiosClient.get(`/purchase-receipts/${id}`),

  createPurchaseReceipt: (data) =>
    axiosClient.post("/purchase-receipts", data),

  confirmPurchaseReceipt: (id) =>
    axiosClient.post(`/purchase-receipts/${id}/confirm`),

  cancelPurchaseReceipt: (id) =>
    axiosClient.post(`/purchase-receipts/${id}/cancel`),

  // ==========================================
  // 5. INVENTORY STOCK - TỒN KHO
  // ==========================================

  getInventoryStock: (params = {}) =>
    axiosClient.get("/inventory/stock", { params }),

  // ==========================================
  // 6. STOCK TRANSFERS - ĐIỀU CHUYỂN KHO
  // ==========================================

  getTransfers: (params = {}) =>
    axiosClient.get("/stock-transfers", { params }),

  getTransferById: (id) =>
    axiosClient.get(`/stock-transfers/${id}`),

  createTransfer: (data) =>
    axiosClient.post("/stock-transfers", data),

  shipTransfer: (id) =>
    axiosClient.post(`/stock-transfers/${id}/ship`),

  receiveTransfer: (id) =>
    axiosClient.post(`/stock-transfers/${id}/receive`),

  cancelTransfer: (id) =>
    axiosClient.post(`/stock-transfers/${id}/cancel`),

  // ==========================================
  // 7. STOCKTAKES - KIỂM KÊ
  // ==========================================

  getStocktakes: (params = {}) =>
    axiosClient.get("/stocktakes", { params }),

  getStocktakeById: (id) =>
    axiosClient.get(`/stocktakes/${id}`),

  createStocktake: (data) =>
    axiosClient.post("/stocktakes", data),

  updateStocktakeCounts: (id, data) =>
    axiosClient.put(`/stocktakes/${id}/counts`, data),

  completeStocktake: (id) =>
    axiosClient.post(`/stocktakes/${id}/complete`),

  deleteStocktake: (id) =>
    axiosClient.delete(`/stocktakes/${id}`),

  // ==========================================
  // 8. INVENTORY LEDGER - SỔ KHO
  // ==========================================

  getInventoryLedger: (params = {}) =>
    axiosClient.get("/inventory/ledger", { params }),

  // ==========================================
  // 9. INVENTORY ALERT - CẢNH BÁO TỒN KHO
  // ==========================================

  getLowStockAlerts: (params = {}) =>
    axiosClient.get("/inventory/stock", {
      params: {
        ...params,
        lowStockOnly: true,
      },
    }),
};

export default inventoryApi;
