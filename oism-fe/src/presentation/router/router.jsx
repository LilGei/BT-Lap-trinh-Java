import {
  createBrowserRouter,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@/application/context/AppProvider";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";
import MainLayout from "@/presentation/components/layout/MainLayout";

// Auth & Error Pages
import LoginUser from "@/presentation/pages/auth/LoginUser";
import AdminLogin from "@/presentation/pages/auth/AdminLogin";
import Register from "@/presentation/pages/auth/Register";
import ForgotPassword from "@/presentation/pages/auth/ForgotPassword";
import UnauthorizedPage from "@/presentation/pages/auth/UnauthorizedPage";
import NotFoundPage from "@/presentation/pages/auth/NotFoundPage";

// Admin & Operation Pages
import OverviewPage from "@/presentation/pages/admin/OverviewPage";
import OrdersPage from "@/presentation/pages/admin/OrdersPage";
import WebhookSimulatorPage from "@/presentation/pages/admin/WebhookSimulatorPage";
import ProductPage from "@/presentation/pages/admin/ProductPage";
import BrandPage from "@/presentation/pages/admin/BrandPage";
import CategoryPage from "@/presentation/pages/admin/CategoryPage";
import SkuPage from "@/presentation/pages/admin/SkuPage";
import WarehousePage from "@/presentation/pages/admin/WarehousePage";
import ImportPage from "@/presentation/pages/admin/ImportPage";
import StocktakePage from "@/presentation/pages/admin/StocktakePage";
import TransferPage from "@/presentation/pages/admin/TransferPage";
import LedgerPage from "@/presentation/pages/admin/LedgerPage";
import InventoryAlertPage from "@/presentation/pages/admin/InventoryAlertPage";
import ReportsPage from "@/presentation/pages/admin/ReportsPage";
import AiSuggestPage from "@/presentation/pages/admin/AiSuggestPage";
import StaffPage from "@/presentation/pages/admin/StaffPage";

// POS Page
import PosPage from "@/presentation/pages/pos/PosPage";

const ALL_ADMIN_STAFF = ["OWNER", "ADMIN", "STAFF"];
const OWNER_ONLY = ["OWNER", "ADMIN"];
const POS_ROLES = ["OWNER", "ADMIN", "STAFF", "CASHIER"];

// Bảo vệ các trang không dùng MainLayout (như POS)
function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const hasToken = Boolean(user || tokenStorage.getToken());

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || "OWNER").toUpperCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Bảo vệ các trang có Sidebar & MainLayout kèm phân quyền RBAC
function AdminLayoutWrapper({ allowedRoles, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const hasToken = Boolean(user || tokenStorage.getToken());
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || "OWNER").toUpperCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const currentPage = location.pathname.replace("/", "") || "overview";

  const handleNavigate = (pageId) => {
    navigate(`/${pageId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {children}
    </MainLayout>
  );
}

export const router = createBrowserRouter([
  // Public Auth Routes
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginUser /> },
  { path: "/admin-login", element: <AdminLogin /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },

  // Error Routes
  { path: "/unauthorized", element: <UnauthorizedPage /> },

  // POS Route (Cashier + Staff + Owner)
  {
    path: "/pos",
    element: (
      <ProtectedRoute allowedRoles={POS_ROLES}>
        <PosPage />
      </ProtectedRoute>
    ),
  },

  // Owner & Staff Routes
  {
    path: "/overview",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <OverviewPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/orders",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <OrdersPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/webhook",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <WebhookSimulatorPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/products",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <ProductPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/brands",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <BrandPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/categories",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <CategoryPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/sku",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <SkuPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/warehouse",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <WarehousePage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/import",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <ImportPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/stocktake",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <StocktakePage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/transfer",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <TransferPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/ledger",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <LedgerPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/inventory-alert",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <InventoryAlertPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/ai-suggest",
    element: (
      <AdminLayoutWrapper allowedRoles={ALL_ADMIN_STAFF}>
        <AiSuggestPage />
      </AdminLayoutWrapper>
    ),
  },

  // Owner / Admin Only Routes
  {
    path: "/reports",
    element: (
      <AdminLayoutWrapper allowedRoles={OWNER_ONLY}>
        <ReportsPage />
      </AdminLayoutWrapper>
    ),
  },
  {
    path: "/staff",
    element: (
      <AdminLayoutWrapper allowedRoles={OWNER_ONLY}>
        <StaffPage />
      </AdminLayoutWrapper>
    ),
  },

  // 404 Not Found
  { path: "*", element: <NotFoundPage /> },
]);

export default router;