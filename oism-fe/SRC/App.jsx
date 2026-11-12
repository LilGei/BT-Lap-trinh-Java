
import { useState } from "react";

import MainLayout from "./components/layout/MainLayout";

import OrdersPage from "./pages/OrdersPage";
import WebhookSimulatorPage from "./pages/WebhookSimulatorPage";
import WarehousePage from "./pages/WarehousePage";
import InventoryAlertPage from "./pages/InventoryAlertPage";
import ReportsPage from "./pages/ReportsPage";
import OverviewPage from "./pages/OverviewPage";
import LoginPage from "./pages/LoginPage";

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

function App() {
  const [currentPage, setCurrentPage] = useState("orders");

  // Tạm giữ đăng nhập mặc định để không làm thay đổi
  // trải nghiệm mở ứng dụng hiện tại.
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage("orders");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("orders");
  };

  const renderPage = () => {
    switch (currentPage) {
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

      case "overview":
        return <OverviewPage />;

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
        return <OrdersPage />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </MainLayout>
  );
}

export default App;
