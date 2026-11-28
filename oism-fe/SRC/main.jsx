// Khung chạy tạm để docker compose dựng được FE. FE owner có thể thay bằng App/router thật.
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import BrandPage from "./pages/BrandPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import SkuPage from "./pages/SkuPage.jsx";
import ImportPage from "./pages/ImportPage.jsx";
import TransferPage from "./pages/TransferPage.jsx";
import StocktakePage from "./pages/StocktakePage.jsx";
import LedgerPage from "./pages/LedgerPage.jsx";
import AiSuggestPage from "./pages/AiSuggestPage.jsx";

const routes = [
  ["/brands", "Thương hiệu", BrandPage],
  ["/categories", "Danh mục", CategoryPage],
  ["/products", "Sản phẩm", ProductPage],
  ["/skus", "SKU", SkuPage],
  ["/import", "Nhập hàng", ImportPage],
  ["/transfer", "Điều chuyển", TransferPage],
  ["/stocktake", "Kiểm kê", StocktakePage],
  ["/ledger", "Sổ kho", LedgerPage],
  ["/ai", "Gợi ý AI", AiSuggestPage],
];

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <nav style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd", flexWrap: "wrap" }}>
      {routes.map(([path, label]) => <Link key={path} to={path}>{label}</Link>)}
    </nav>
    <Routes>
      {routes.map(([path, , Page]) => <Route key={path} path={path} element={<Page />} />)}
      <Route path="*" element={<p style={{ padding: 16 }}>Chọn một trang ở thanh trên.</p>} />
    </Routes>
  </BrowserRouter>
);
