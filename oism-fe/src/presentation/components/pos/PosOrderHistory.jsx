import { useEffect, useMemo, useState } from "react";
import formatMoney from "./formatMoney";
import "@/presentation/styles/PosOrderHistory.css";

const paymentMethodLabels = {
  cash: "Tiền mặt",
  qr: "QR / Ví điện tử",
  card: "Thẻ",
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

function PosOrderHistory({ orders }) {
  const [keyword, setKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!selectedOrder) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedOrder(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrder]);

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi");
    if (!normalizedKeyword) return orders;

    return orders.filter((order) => {
      const searchableContent = [
        order.id,
        order.customer.name,
        ...order.items.flatMap((item) => [item.name, item.sku]),
      ]
        .join(" ")
        .toLocaleLowerCase("vi");

      return searchableContent.includes(normalizedKeyword);
    });
  }, [orders, keyword]);

  const totalRevenue = orders.reduce((total, order) => total + order.total, 0);

  return (
    <main className="pos-order-history">
      <header className="pos-order-history-header">
        <div>
          <h2>Lịch sử bán hàng tại quầy</h2>
          <p>Chỉ bao gồm giao dịch được thanh toán từ POS này.</p>
        </div>
        <label className="pos-order-history-search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm mã đơn, khách hàng, sản phẩm..."
            aria-label="Tìm trong lịch sử bán hàng POS"
          />
        </label>
      </header>

      <section className="pos-order-history-stats" aria-label="Tổng quan bán hàng POS">
        <article>
          <span>Số giao dịch</span>
          <strong>{orders.length}</strong>
        </article>
        <article>
          <span>Tổng doanh thu</span>
          <strong>{formatMoney(totalRevenue)}</strong>
        </article>
      </section>

      <section
        className="pos-order-history-list"
        aria-label="Danh sách giao dịch POS"
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <article className="pos-order-history-row" key={order.id}>
              <div className="pos-order-history-order">
                <strong>{order.id}</strong>
                <time dateTime={order.createdAt}>
                  {formatDate(order.createdAt)}
                </time>
              </div>

              <div className="pos-order-history-customer">
                <strong>{order.customer.name}</strong>
                <div className="pos-order-history-tags">
                  <span
                    className={`pos-order-history-payment ${order.paymentMethod}`}
                  >
                    {paymentMethodLabels[order.paymentMethod] || "Khác"}
                  </span>
                  <span className="pos-order-history-item-count">
                    {order.items.reduce(
                      (count, item) => count + item.quantity,
                      0
                    )}{" "}
                    món
                  </span>
                </div>
              </div>

              <strong className="pos-order-history-total">
                {formatMoney(order.total)}
              </strong>

              <button
                type="button"
                className="pos-order-history-details-button"
                onClick={() => setSelectedOrder(order)}
                aria-label={`Xem chi tiết đơn ${order.id}`}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                <span>Xem chi tiết</span>
              </button>
            </article>
          ))
        ) : (
          <div className="pos-order-history-empty">
            <span aria-hidden="true">⌁</span>
            <strong>
              {orders.length === 0
                ? "Chưa có giao dịch POS"
                : "Không tìm thấy giao dịch"}
            </strong>
            <p>
              {orders.length === 0
                ? "Các đơn hàng sẽ xuất hiện ở đây sau khi thanh toán thành công tại quầy."
                : "Thử tìm bằng mã đơn, tên khách hàng, tên sản phẩm hoặc SKU."}
            </p>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div
          className="pos-order-detail-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            className="pos-order-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-order-detail-title"
          >
            <header className="pos-order-detail-header">
              <div>
                <h3 id="pos-order-detail-title">Chi tiết giao dịch</h3>
                <strong>{selectedOrder.id}</strong>
                <time dateTime={selectedOrder.createdAt}>
                  {formatDate(selectedOrder.createdAt)}
                </time>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết giao dịch"
              >
                ×
              </button>
            </header>

            <div className="pos-order-detail-meta">
              <span>
                <small>Khách hàng</small>
                <strong>{selectedOrder.customer.name}</strong>
              </span>
              <span>
                <small>Thanh toán</small>
                <strong>
                  {paymentMethodLabels[selectedOrder.paymentMethod] || "Khác"}
                </strong>
              </span>
            </div>

            <div className="pos-order-detail-items-scroll">
              <ul className="pos-order-detail-items">
                {selectedOrder.items.map((item) => (
                  <li key={`${selectedOrder.id}-${item.id}`}>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.sku}</small>
                    </span>
                    <span>
                      {item.quantity} × {formatMoney(item.price)}
                    </span>
                    <strong>{formatMoney(item.quantity * item.price)}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pos-order-detail-totals">
              <div>
                <span>Tạm tính</span>
                <span>{formatMoney(selectedOrder.subtotal)}</span>
              </div>
              <div>
                <span>VAT</span>
                <span>{formatMoney(selectedOrder.vat)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div>
                  <span>Giảm giá</span>
                  <span>−{formatMoney(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="pos-order-detail-grand-total">
                <strong>Tổng cộng</strong>
                <strong>{formatMoney(selectedOrder.total)}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default PosOrderHistory;
