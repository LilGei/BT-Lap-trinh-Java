import { useState } from "react";
import "./App.css";

import MainLayout from "./components/layout/MainLayout";

import OrdersPage from "./pages/OrdersPage";
import WebhookSimulatorPage from "./pages/WebhookSimulatorPage";
import WarehousePage from "./pages/WarehousePage";

function ComingSoon({ title }) {
  return (
    <div
      style={{
        minHeight: "100%",
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

function App() {
  const [currentPage, setCurrentPage] = useState("orders");

  const renderPage = () => {
    switch (currentPage) {
      case "orders":
        return <OrdersPage />;

      case "webhook":
        return <WebhookSimulatorPage />;

      case "warehouse":
        return <WarehousePage />;

      case "overview":
        return <ComingSoon title="Tổng quan hệ thống" />;

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

      case "inventory-alert":
        return <ComingSoon title="Cảnh báo tồn kho" />;

      case "reports":
        return <ComingSoon title="Doanh thu & Lợi nhuận" />;

      case "settings":
        return <ComingSoon title="Cài đặt" />;

      default:
        return <OrdersPage />;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;