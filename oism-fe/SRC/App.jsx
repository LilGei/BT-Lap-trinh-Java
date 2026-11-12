import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";

import LoginUser from "./pages/LoginUser";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import OrdersPage from "./pages/OrdersPage";
import WebhookSimulatorPage from "./pages/WebhookSimulatorPage";
import WarehousePage from "./pages/WarehousePage";
import InventoryAlertPage from "./pages/InventoryAlertPage";
import ReportsPage from "./pages/ReportsPage";
import OverviewPage from "./pages/OverviewPage";

function ComingSoon({ title }) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
        color: "#64748b",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#0f172a" }}>{title}</h2>
      <p>Chức năng này sẽ được triển khai trong các bước tiếp theo.</p>
    </div>
  );
}

function DashboardApp() {
  const [currentPage, setCurrentPage] = useState("overview");

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage />;
      case "orders":
        return <OrdersPage />;
      case "webhook":
        return <WebhookSimulatorPage />;
      case "warehouse":
        return <WarehousePage />;
      case "inventory-alert":
        return <InventoryAlertPage />;
      case "reports":
        return <ReportsPage />;
      case "pos":
        return <ComingSoon title="Bán hàng POS" />;
      case "products":
        return <ComingSoon title="Quản lý sản phẩm" />;
      case "import":
        return <ComingSoon title="Nhập kho" />;
      case "stocktake":
        return <ComingSoon title="Kiểm kê" />;
      case "transfer":
        return <ComingSoon title="Điều chuyển" />;
      case "settings":
        return <ComingSoon title="Cài đặt" />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginUser />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/*" element={<DashboardApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;