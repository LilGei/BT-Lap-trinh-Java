
import "./Sidebar.css";

const menuGroups = [
  {
    title: "",
    items: [
      { id: "overview", label: "Tổng quan", icon: "grid" },
    ],
  },
  {
    title: "QUẢN LÝ BÁN HÀNG",
    items: [
      { id: "orders", label: "Đơn hàng", icon: "cart" },
      { id: "pos", label: "Bán hàng POS", icon: "monitor" },
      { id: "webhook", label: "Webhook Simulator", icon: "webhook" },
    ],
  },
  {
    title: "KHO & TỒN KHO",
    items: [
      { id: "products", label: "Sản phẩm", icon: "package" },
      { id: "warehouse", label: "Chi nhánh & Kho", icon: "warehouse" },
      { id: "import", label: "Nhập kho", icon: "import" },
      { id: "stocktake", label: "Kiểm kê", icon: "clipboard" },
      { id: "transfer", label: "Điều chuyển", icon: "transfer" },
      { id: "inventory-alert", label: "Cảnh báo tồn kho", icon: "alert" },
    ],
  },
  {
    title: "BÁO CÁO",
    items: [
      { id: "reports", label: "Doanh thu & Lợi nhuận", icon: "chart" },
    ],
  },
];

const iconPaths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1" />
      <circle cx="19" cy="20" r="1" />
      <path d="M2 3h2l2.5 12h12l3-9H5" />
      <path d="M7 15h12" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  webhook: (
    <>
      <path d="M8 8a4 4 0 1 1 7 2.5L12 14" />
      <path d="M5 14a4 4 0 1 0 7 2.5L15 13" />
      <path d="M15 7h4M17 5v4M5 17H3" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8M12 13v9" />
    </>
  ),
  warehouse: (
    <>
      <path d="M3 10 12 3l9 7v11H3V10Z" />
      <path d="M8 21v-8h8v8M8 9h8" />
    </>
  ),
  import: (
    <>
      <path d="M12 16V3M7 8l5-5 5 5" />
      <path d="M4 14v6h16v-6" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2h6v2M8 10h8M8 14h6" />
    </>
  ),
  transfer: (
    <>
      <path d="M4 7h15l-3-3M20 17H5l3 3" />
    </>
  ),
  alert: (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21V11M9 21V7M15 21V3M21 21V13" />
      <path d="m3 8 6-4 6 2 6-5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
};

function MenuIcon({ name }) {
  return (
    <svg
      className="sidebar-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="oism-sidebar">
      <div className="sidebar-brand">
        <h2>OISM</h2>
        <span>INVENTORY MANAGEMENT</span>
      </div>

      <nav className="sidebar-navigation">
        {menuGroups.map((group, index) => (
          <div className="sidebar-group" key={group.title || index}>
            {group.title && (
              <div className="sidebar-group-title">{group.title}</div>
            )}

            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${
                  currentPage === item.id ? "active" : ""
                }`}
                onClick={() => onNavigate(item.id)}
              >
                <MenuIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className={`sidebar-item ${
            currentPage === "settings" ? "active" : ""
          }`}
          onClick={() => onNavigate("settings")}
        >
          <MenuIcon name="settings" />
          <span>Cài đặt</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <MenuIcon name="user" />
          </div>

          <div className="sidebar-user-info">
            <strong>Admin</strong>
            <span>Quản trị viên</span>
          </div>

          <MenuIcon name="chevron" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
