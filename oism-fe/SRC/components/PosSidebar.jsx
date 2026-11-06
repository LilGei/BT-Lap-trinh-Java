import "../styles/PosSidebar.css";

const navigationSections = [
  {
    label: "BÁN HÀNG",
    items: [
      {
        label: "Bán hàng tại quầy",
        icon: (
          <>
            <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </>
        ),
        active: true,
      },
      {
        label: "Đơn hàng",
        icon: (
          <>
            <path d="M7 3.5h8l4 4v13H7z" />
            <path d="M15 3.5v4h4M10 12h6M10 16h6" />
          </>
        ),
      },
    ],
  },
  {
    label: "QUẢN LÝ",
    items: [
      {
        label: "Sản phẩm",
        icon: (
          <>
            <path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9L12 3Z" />
            <path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21" />
          </>
        ),
      },
      {
        label: "Tồn kho",
        icon: (
          <>
            <path d="M4 20V9l8-5 8 5v11H4Z" />
            <path d="M9 20v-6h6v6M4 9h16" />
          </>
        ),
      },
      {
        label: "Khách hàng",
        icon: (
          <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M16 5.5a3 3 0 0 1 0 5.8M18 14a4 4 0 0 1 2.5 3.7V20" />
          </>
        ),
      },
      {
        label: "Báo cáo",
        icon: (
          <>
            <path d="M4 20V11M10 20V5M16 20v-8M22 20H2" />
          </>
        ),
      },
    ],
  },
];

function PosSidebar() {
  return (
    <aside className="pos-sidebar" aria-label="Thanh điều hướng POS">
      <nav className="pos-sidebar__nav">
        {navigationSections.map((section) => (
          <div className="pos-sidebar__section" key={section.label}>
            <span className="pos-sidebar__section-label">{section.label}</span>
            {section.items.map((item) => (
              <div
                className={`pos-sidebar__item${item.active ? " pos-sidebar__item--active" : ""}`}
                key={item.label}
                aria-current={item.active ? "page" : undefined}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pos-sidebar__icon"
                >
                  {item.icon}
                </svg>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="pos-sidebar__footer">
        <span className="pos-sidebar__footer-mark" aria-hidden="true">
          O
        </span>
        <span>
          <strong>OISM POS</strong>
          <small>Phiên bản bán hàng</small>
        </span>
      </div>
    </aside>
  );
}

export default PosSidebar;