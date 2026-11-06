
import { useMemo, useState } from "react";
import "./OrdersPage.css";

const initialOrders = [
  { id: "ORD-00124", channel: "POS", date: "2026-09-02", amount: 1250000, status: "Hoàn thành" },
  { id: "ORD-00125", channel: "Website", date: "2026-10-01", amount: 850000, status: "Chờ xử lý" },
  { id: "ORD-00126", channel: "POS", date: "2026-10-05", amount: 2400000, status: "Đang giao" },
  { id: "ORD-00127", channel: "Website", date: "2026-10-15", amount: 620000, status: "Đã hủy" },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

const formatDate = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

function OrdersPage() {
  const [orders] = useState(initialOrders);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [dateFilter, setDateFilter] = useState("Tất cả");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchKeyword = order.id
        .toLowerCase()
        .includes(keyword.trim().toLowerCase());

      const matchStatus =
        status === "Tất cả" || order.status === status;

      const matchDate =
        dateFilter === "Tất cả" ||
        (dateFilter === "Tháng 10/2026" &&
          order.date.startsWith("2026-10")) ||
        (dateFilter === "Tháng 09/2026" &&
          order.date.startsWith("2026-09"));

      return matchKeyword && matchStatus && matchDate;
    });
  }, [orders, keyword, status, dateFilter]);

  const stats = [
    { title: "Tổng đơn hàng", value: "1.248", note: "Tất cả đơn", color: "blue" },
    { title: "Chờ xử lý", value: "24", note: "Cần kiểm tra", color: "orange" },
    { title: "Đang giao", value: "86", note: "Đang thực hiện", color: "blue" },
    { title: "Đã hoàn thành", value: "1.102", note: "Hoàn tất", color: "green" },
  ];

  return (
    <div className="orders-layout">
      <aside className="orders-sidebar">
        <div className="orders-brand">
          <h2>OISM</h2>
          <span>INVENTORY MANAGEMENT</span>
        </div>

        <nav className="orders-menu">
          {["Đơn hàng", "Tổng quan", "Sản phẩm", "Tồn kho", "Báo cáo", "Cài đặt"].map(
            (item, index) => (
              <div
                key={item}
                className={`orders-menu-item ${index === 0 ? "active" : ""}`}
              >
                {item}
              </div>
            )
          )}
        </nav>
      </aside>

      <main className="orders-main">
        <header className="orders-header">
          <div>
            <h1>Quản lý đơn hàng</h1>
            <p>Theo dõi, duyệt và quản lý đơn hàng trên toàn hệ thống.</p>
          </div>

          <div className="orders-header-actions">
            <button className="btn-export">Xuất báo cáo</button>
            <button className="btn-create">Tạo đơn hàng</button>
          </div>
        </header>

        <section className="orders-stats">
          {stats.map((item) => (
            <div className="orders-stat-card" key={item.title}>
              <span>{item.title}</span>
              <strong className={item.color}>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </section>

        <section className="orders-filters">
          <input
            type="text"
            placeholder="⌕  Tìm theo mã đơn hàng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Chờ xử lý">Chờ xử lý</option>
            <option value="Đang giao">Đang giao</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="Tất cả">Tất cả thời gian</option>
            <option value="Tháng 09/2026">Tháng 09/2026</option>
            <option value="Tháng 10/2026">Tháng 10/2026</option>
          </select>

          <button
            className="btn-filter"
            onClick={() => {
              setKeyword("");
              setStatus("Tất cả");
              setDateFilter("Tất cả");
            }}
          >
            Đặt lại
          </button>
        </section>

        <section className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Mã đơn</th>
                <th>Kênh bán</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.id}</td>
                    <td>{order.channel}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{formatMoney(order.amount)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          order.status === "Hoàn thành"
                            ? "completed"
                            : order.status === "Chờ xử lý"
                            ? "pending"
                            : order.status === "Đang giao"
                            ? "shipping"
                            : "cancelled"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-orders">
                    Không tìm thấy đơn hàng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default OrdersPage;
