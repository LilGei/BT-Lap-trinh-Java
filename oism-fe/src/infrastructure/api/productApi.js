import axiosClient from "@/infrastructure/http/axiosClient";

// Chuẩn hóa dữ liệu danh sách trả về từ Spring Boot
export const extractList = (res) => {
  const payload = res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const productApi = {
  // --- THƯƠNG HIỆU (BRANDS) ---
  getBrands: () => axiosClient.get("/brands"),
  createBrand: (data) => axiosClient.post("/brands", data),
  updateBrand: (id, data) => axiosClient.put(`/brands/${id}`, data),
  deleteBrand: (id) => axiosClient.delete(`/brands/${id}`),

  // --- DANH MỤC (CATEGORIES) ---
  getCategories: () => axiosClient.get("/categories"),
  createCategory: (data) => axiosClient.post("/categories", data),
  updateCategory: (id, data) => axiosClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`),

  // --- SẢN PHẨM (PRODUCTS) ---
  getProducts: () => axiosClient.get("/products"),
  createProduct: (data) => axiosClient.post("/products", data),
  updateProduct: (id, data) => axiosClient.put(`/products/${id}`, data),
  deleteProduct: (id) => axiosClient.delete(`/products/${id}`),

  // --- BIẾN THỂ & MÃ VẠCH (SKUS) ---
  getSkus: () => axiosClient.get("/skus"),
  createSku: (data) => axiosClient.post("/skus", data),
  updateSku: (id, data) => axiosClient.put(`/skus/${id}`, data),
  deleteSku: (id) => axiosClient.delete(`/skus/${id}`),
};

export default productApi;