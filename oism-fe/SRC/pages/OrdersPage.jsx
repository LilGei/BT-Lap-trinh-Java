
import { useMemo, useState } from "react";
import "./OrdersPage.css";

const initialOrders = [
  {
    id: "ORD-00124",
    channel: "POS",
    date: "2026-09-02",
    amount: 1250000,
    status: "Hoàn thành",
  },
  {
    id: "ORD-00125",
    channel: "Website",
    date: "2026-10-01",
    amount: 850000,
    status: "Chờ xử lý",
  },
  {
    id: "ORD-00126",
    channel: "POS",
    date: "2026-10-05",
    amount: 2400000,
    status: "Đang giao",
  },
  {
    id: "ORD-00127",
    channel: "Website",
    date: "2026-10-15",
    amount: 620000,
    status: "Đã hủy",
  },
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

const formatDate = (date) => {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("Tất cả");
  const [dateFilter, setDateFilter] = useState("Tất cả");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    channel: "POS",
    date: getToday(),
    amount: "",
  });

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
    {
      title: "Tổng đơn hàng",
      value: "1.248",
      note: "Tất cả đơn",
      color: "blue",
    },
    {
      title: "Chờ xử lý",
      value: "24",
      note: "Cần kiểm tra",
      color: "orange",
    },
    {
      title: "Đang giao",
      value: "86",
      note: "Đang thực hiện",
      color: "blue",
    },
    {
      title: "Đã hoàn thành",
      value: "1.102",
      note: "Hoàn tất",
      color: "green",
    },
  ];

  // Xuất danh sách đơn hàng đang được hiển thị ra file CSV
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      alert("Không có đơn hàng để xuất báo cáo.");
      return;
    }

    const headers = [
      "STT",
      "Mã đơn",
      "Kênh bán",
      "Ngày tạo",
      "Tổng tiền",
      "Trạng thái",
    ];

    const rows = filteredOrders.map((order, index) => [
      index + 1,
      order.id,
      order.channel,
      formatDate(order.date),
      order.amount,
      order.status,
    ]);

    const escapeCSV = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Bao-cao-don-hang-${getToday()}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // Mở form tạo đơn hàng
  const handleOpenCreate = () => {
    setNewOrder({
      channel: "POS",
      date: getToday(),
      amount: "",
    });

    setShowCreateModal(true);
  };

  // Lưu đơn hàng mới
  const handleCreateOrder = (e) => {
    e.preventDefault();

    const amount = Number(newOrder.amount);

    if (!newOrder.date || !newOrder.channel || amount <= 0) {
      alert("Vui lòng nhập đầy đủ thông tin đơn hàng hợp lệ.");
      return;
    }

    const maxId = orders.reduce((max, order) => {
      const number = Number(order.id.replace("ORD-", ""));
      return Math.max(max, number);
    }, 0);

    const createdOrder = {
      id: `ORD-${String(maxId + 1).padStart(5, "0")}`,
      channel: newOrder.channel,
      date: newOrder.date,
      amount,
      status: "Chờ xử lý",
    };

    setOrders((prevOrders) => [createdOrder, ...prevOrders]);
    setShowCreateModal(false);

    setKeyword("");
    setStatus("Tất cả");
    setDateFilter("Tất cả");

    alert(`Đã tạo đơn hàng ${createdOrder.id} thành công!`);
  };

  const handleApprove = () => {
    if (!selectedOrder) return;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, status: "Đang giao" }
          : order
      )
    );

    setSelectedOrder((prev) => ({
      ...prev,
      status: "Đang giao",
    }));
  };

  const handleCancel = () => {
    if (!selectedOrder) return;

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy đơn hàng này?"
    );

    if (!confirmed) return;

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, status: "Đã hủy" }
          : order
      )
    );

    setSelectedOrder((prev) => ({
      ...prev,
      status: "Đã hủy",
    }));
  };

  const getStatusClass = (orderStatus) => {
    if (orderStatus === "Hoàn thành") return "completed";
    if (orderStatus === "Chờ xử lý") return "pending";
    if (orderStatus === "Đang giao") return "shipping";
    return "cancelled";
  };

  return (
    <div className="orders-page">
      <main className="orders-main">
        <header className="orders-header">
          <div>
            <h1>Quản lý đơn hàng</h1>
            <p>
              Theo dõi, duyệt và quản lý đơn hàng trên toàn hệ thống.
            </p>
          </div>

          <div className="orders-header-actions">
            <button
              type="button"
              className="btn-export"
              onClick={handleExport}
            >
              Xuất báo cáo
            </button>

            <button
              type="button"
              className="btn-create"
              onClick={handleOpenCreate}
            >
              Tạo đơn hàng
            </button>
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

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
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
            type="button"
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
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{index + 1}</td>
                    <td>{order.id}</td>
                    <td>{order.channel}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{formatMoney(order.amount)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          order.status
                        )}`}
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

      {/* Modal tạo đơn hàng */}
      {showCreateModal && (
        <div
          className="order-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Tạo đơn hàng mới</h2>

            <form onSubmit={handleCreateOrder}>
              <div className="order-form-group">
                <label>Mã đơn hàng</label>
                <input
                  type="text"
                  value={`ORD-${String(
                    orders.reduce((max, order) => {
                      return Math.max(
                        max,
                        Number(order.id.replace("ORD-", ""))
                      );
                    }, 0) + 1
                  ).padStart(5, "0")}`}
                  disabled
                />
              </div>

              <div className="order-form-group">
                <label>Kênh bán</label>
                <select
                  value={newOrder.channel}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      channel: e.target.value,
                    })
                  }
                >
                  <option value="POS">POS</option>
                  <option value="Website">Website</option>
                </select>
              </div>

              <div className="order-form-group">
                <label>Ngày tạo</label>
                <input
                  type="date"
                  value={newOrder.date}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="order-form-group">
                <label>Tổng tiền (VNĐ)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Nhập tổng tiền đơn hàng"
                  value={newOrder.amount}
                  onChange={(e) =>
                    setNewOrder({
                      ...newOrder,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="order-modal-actions">
                <button type="submit" className="btn-approve">
                  Tạo đơn hàng
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Chi tiết đơn hàng</h2>

            <p>
              <strong>Mã đơn:</strong> {selectedOrder.id}
            </p>

            <p>
              <strong>Kênh bán:</strong> {selectedOrder.channel}
            </p>

            <p>
              <strong>Ngày tạo:</strong>{" "}
              {formatDate(selectedOrder.date)}
            </p>

            <p>
              <strong>Tổng tiền:</strong>{" "}
              {formatMoney(selectedOrder.amount)}
            </p>

            <p>
              <strong>Trạng thái:</strong> {selectedOrder.status}
            </p>

            <div className="order-modal-actions">
              {selectedOrder.status === "Chờ xử lý" && (
                <>
                  <button
                    type="button"
                    className="btn-approve"
                    onClick={handleApprove}
                  >
                    Duyệt đơn
                  </button>

                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancel}
                  >
                    Hủy đơn
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn-print"
                onClick={() => window.print()}
              >
                In phiếu
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
