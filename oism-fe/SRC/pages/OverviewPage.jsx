
import { useMemo, useState } from "react";
import "../styles/OverviewPage.css";

const revenueData = [
  { label: "T2", revenue: 35, orders: 18 },
  { label: "T3", revenue: 52, orders: 25 },
  { label: "T4", revenue: 43, orders: 21 },
  { label: "T5", revenue: 68, orders: 32 },
  { label: "T6", revenue: 58, orders: 28 },
  { label: "T7", revenue: 85, orders: 40 },
  { label: "CN", revenue: 72, orders: 35 },
];

const recentOrders = [
  {
    id: "ORD-00128",
    customer: "Khách hàng POS",
    channel: "POS",
    date: "12/11/2026",
    amount: 1250000,
    status: "Hoàn thành",
  },
  {
    id: "ORD-00127",
    customer: "Nguyễn Minh Anh",
    channel: "Website",
    date: "12/11/2026",
    amount: 850000,
    status: "Chờ xử lý",
  },
  {
    id: "ORD-00126",
    customer: "Trần Quốc Bảo",
    channel: "POS",
    date: "11/11/2026",
    amount: 2400000,
    status: "Đang giao",
  },
  {
    id: "ORD-00125",
    customer: "Lê Hoàng Nam",
    channel: "Website",
    date: "10/11/2026",
    amount: 620000,
    status: "Đã hủy",
  },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

function OverviewPage() {
  const [period, setPeriod] = useState("7 ngày qua");

  const stats = [
    {
      title: "Tổng doanh thu",
      value: "128.450.000đ",
      change: "+12,8%",
      note: "So với kỳ trước",
      icon: "₫",
      color: "blue",
    },
    {
      title: "Tổng đơn hàng",
      value: "1.248",
      change: "+8,2%",
      note: "So với kỳ trước",
      icon: "▤",
      color: "purple",
    },
    {
      title: "Sản phẩm",
      value: "856",
      change: "+4,5%",
      note: "Sản phẩm đang quản lý",
      icon: "▣",
      color: "orange",
    },
    {
      title: "Tồn kho",
      value: "12.580",
      change: "18 sản phẩm",
      note: "Đang ở mức tồn thấp",
      icon: "▦",
      color: "green",
    },
  ];

  const orderStats = [
    { label: "Chờ xử lý", value: 24, color: "pending" },
    { label: "Đang giao", value: 86, color: "shipping" },
    { label: "Hoàn thành", value: 1102, color: "completed" },
    { label: "Đã hủy", value: 36, color: "cancelled" },
  ];

  const maxRevenue = useMemo(
    () => Math.max(...revenueData.map((item) => item.revenue)),
    []
  );

  const getStatusClass = (status) => {
    if (status === "Hoàn thành") return "completed";
    if (status === "Chờ xử lý") return "pending";
    if (status === "Đang giao") return "shipping";
    return "cancelled";
  };

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div>
          <h1>Tổng quan</h1>
          <p>
            Theo dõi tình hình kinh doanh và hoạt động tồn kho toàn hệ thống.
          </p>
        </div>

        <div className="overview-header-right">
          <span className="overview-date">
            Ngày {new Date().toLocaleDateString("vi-VN")}
          </span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Chọn khoảng thời gian"
          >
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option>Quý này</option>
          </select>
        </div>
      </header>

      <section className="overview-stats">
        {stats.map((item) => (
          <article className="overview-stat-card" key={item.title}>
            <div className="overview-stat-top">
              <span>{item.title}</span>
              <div className={`overview-stat-icon ${item.color}`}>
                {item.icon}
              </div>
            </div>

            <strong className="overview-stat-value">{item.value}</strong>

            <div className="overview-stat-bottom">
              <span className="overview-stat-change">{item.change}</span>
              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="overview-main-grid">
        <article className="overview-panel overview-revenue-panel">
          <div className="overview-panel-header">
            <div>
              <h2>Doanh thu bán hàng</h2>
              <p>Biểu đồ doanh thu trong {period.toLowerCase()}</p>
            </div>
            <span className="overview-panel-total">128,45 triệu</span>
          </div>

          <div className="overview-chart">
            <div className="overview-chart-y">
              <span>100tr</span>
              <span>75tr</span>
              <span>50tr</span>
              <span>25tr</span>
              <span>0</span>
            </div>

            <div className="overview-chart-content">
              <div className="overview-chart-grid">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="overview-bars">
                {revenueData.map((item) => (
                  <div className="overview-bar-group" key={item.label}>
                    <div className="overview-bar-track">
                      <div
                        className="overview-bar"
                        style={{
                          height: `${(item.revenue / maxRevenue) * 100}%`,
                        }}
                        title={`${item.revenue} triệu đồng`}
                      />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overview-chart-legend">
            <span className="overview-legend-dot" />
            Doanh thu (triệu đồng)
          </div>
        </article>

        <article className="overview-panel overview-order-panel">
          <div className="overview-panel-header">
            <div>
              <h2>Trạng thái đơn hàng</h2>
              <p>Tổng quan đơn hàng trong hệ thống</p>
            </div>
          </div>

          <div className="overview-order-total">
            <strong>1.248</strong>
            <span>Tổng đơn hàng</span>
          </div>

          <div className="overview-order-list">
            {orderStats.map((item) => (
              <div className="overview-order-item" key={item.label}>
                <div className="overview-order-label">
                  <span className={`overview-order-dot ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <strong>{item.value.toLocaleString("vi-VN")}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-bottom-grid">
        <article className="overview-panel overview-inventory-panel">
          <div className="overview-panel-header">
            <div>
              <h2>Tình hình tồn kho</h2>
              <p>Thống kê trạng thái hàng hóa</p>
            </div>
            <span className="overview-small-link">Chi tiết tồn kho</span>
          </div>

          <div className="overview-inventory-summary">
            <div className="overview-inventory-number">
              <strong>856</strong>
              <span>Tổng sản phẩm</span>
            </div>
            <div className="overview-inventory-number">
              <strong className="inventory-warning">18</strong>
              <span>Sắp hết hàng</span>
            </div>
            <div className="overview-inventory-number">
              <strong className="inventory-danger">5</strong>
              <span>Đã hết hàng</span>
            </div>
          </div>

          <div className="overview-stock-progress">
            <div className="overview-stock-progress-bar">
              <span className="stock-normal" />
              <span className="stock-low" />
              <span className="stock-out" />
            </div>
            <div className="overview-stock-legend">
              <span><i className="stock-normal-dot" /> Đủ hàng</span>
              <span><i className="stock-low-dot" /> Sắp hết</span>
              <span><i className="stock-out-dot" /> Hết hàng</span>
            </div>
          </div>
        </article>

        <article className="overview-panel overview-channel-panel">
          <div className="overview-panel-header">
            <div>
              <h2>Kênh bán hàng</h2>
              <p>Tỷ trọng đơn hàng theo kênh</p>
            </div>
          </div>

          <div className="overview-channel-row">
            <div className="overview-channel-info">
              <span>Website</span>
              <strong>62%</strong>
            </div>
            <div className="overview-channel-track">
              <span className="website-channel" />
            </div>
          </div>

          <div className="overview-channel-row">
            <div className="overview-channel-info">
              <span>POS tại cửa hàng</span>
              <strong>38%</strong>
            </div>
            <div className="overview-channel-track">
              <span className="pos-channel" />
            </div>
          </div>
        </article>
      </section>

      <section className="overview-panel overview-recent-panel">
        <div className="overview-panel-header">
          <div>
            <h2>Đơn hàng gần đây</h2>
            <p>Các đơn hàng mới được ghi nhận trong hệ thống</p>
          </div>
          <span className="overview-small-link">Danh sách đơn hàng</span>
        </div>

        <div className="overview-table-wrapper">
          <table className="overview-table">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Khách hàng</th>
                <th>Kênh bán</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="overview-order-id">{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.channel}</td>
                  <td>{order.date}</td>
                  <td>{formatMoney(order.amount)}</td>
                  <td>
                    <span
                      className={`overview-status ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
