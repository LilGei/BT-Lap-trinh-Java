import { useCallback, useEffect, useState } from "react";
import formatMoney from "./formatMoney";
import "@/presentation/styles/CartCheckoutModal.css";

const formatReceiptDateTime = (dateTime) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateTime));

function CartCheckoutModal({
  items,
  subtotal,
  vat,
  discount,
  total,
  selectedCustomer,
  shopInfo,
  onPaymentComplete,
  onClose,
}) {
  const [checkoutStatus, setCheckoutStatus] = useState("payment");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState(String(total));
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDateTime, setOrderDateTime] = useState("");

  const cashReceivedAmount = Number(cashReceived) || 0;
  const canConfirmCash =
    cashReceived.trim() !== "" &&
    Number.isFinite(cashReceivedAmount) &&
    cashReceivedAmount >= total;

  const handleClose = useCallback(
    () => onClose(checkoutStatus === "complete"),
    [checkoutStatus, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const confirmPayment = () => {
    const completedAt = new Date();
    const completedOrderNumber = `POS-${completedAt.getTime()}`;

    onPaymentComplete({
      id: completedOrderNumber,
      createdAt: completedAt.toISOString(),
      customer: {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
      },
      items: items.map(({ id, name, sku, price, quantity }) => ({
        id,
        name,
        sku,
        price,
        quantity,
      })),
      subtotal,
      vat,
      discount,
      total,
      paymentMethod,
    });
    setOrderNumber(completedOrderNumber);
    setOrderDateTime(completedAt.toISOString());
    setCheckoutStatus("complete");
  };

  return (
    <div
      className="pos-checkout-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        className="pos-checkout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-checkout-title"
      >
        {checkoutStatus === "payment" ? (
          <>
            <header className="pos-checkout-header">
              <div>
                <h2 id="pos-checkout-title">Thanh toán</h2>
                <p>Chọn phương thức thanh toán cho đơn hàng</p>
              </div>
              <button
                type="button"
                className="pos-checkout-close"
                onClick={handleClose}
                aria-label="Đóng cửa sổ thanh toán"
              >
                ×
              </button>
            </header>

            <div className="pos-checkout-total">
              <span>Khách cần thanh toán</span>
              <strong>{formatMoney(total)}</strong>
            </div>

            <fieldset className="pos-payment-methods">
              <legend>Phương thức thanh toán</legend>
              <button
                type="button"
                className={`pos-payment-method ${
                  paymentMethod === "cash" ? "active" : ""
                }`}
                onClick={() => setPaymentMethod("cash")}
                aria-pressed={paymentMethod === "cash"}
              >
                <span className="pos-payment-icon cash" aria-hidden="true">
                  ₫
                </span>
                <strong>Tiền mặt</strong>
                <small>Nhận tiền tại quầy</small>
              </button>
              <button
                type="button"
                className={`pos-payment-method ${
                  paymentMethod === "qr" ? "active" : ""
                }`}
                onClick={() => setPaymentMethod("qr")}
                aria-pressed={paymentMethod === "qr"}
              >
                <span className="pos-payment-icon qr" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-2zM14 18h2v2h-2z" />
                  </svg>
                </span>
                <strong>QR / Ví điện tử</strong>
                <small>Quét mã thanh toán</small>
              </button>
              <button
                type="button"
                className={`pos-payment-method ${
                  paymentMethod === "card" ? "active" : ""
                }`}
                onClick={() => setPaymentMethod("card")}
                aria-pressed={paymentMethod === "card"}
              >
                <span className="pos-payment-icon card" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18M7 15h4" />
                  </svg>
                </span>
                <strong>Thẻ</strong>
                <small>Qua thiết bị POS</small>
              </button>
            </fieldset>

            <div className="pos-payment-details">
              {paymentMethod === "cash" && (
                <>
                  <label htmlFor="pos-cash-received">Tiền khách đưa</label>
                  <div className="pos-cash-input-wrap">
                    <input
                      id="pos-cash-received"
                      type="number"
                      min="0"
                      step="1000"
                      value={cashReceived}
                      onChange={(event) => setCashReceived(event.target.value)}
                    />
                    <span>đ</span>
                  </div>
                  <div
                    className="pos-cash-quick-amounts"
                    aria-label="Số tiền gợi ý"
                  >
                    {[
                      { label: "100k", amount: 100000 },
                      { label: "200k", amount: 200000 },
                      { label: "500k", amount: 500000 },
                      { label: "Đủ tiền", amount: total },
                    ].map(({ label, amount }) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setCashReceived(String(amount))}
                        aria-label={
                          label === "Đủ tiền"
                            ? `Điền đủ ${formatMoney(total)}`
                            : `Điền ${label}`
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="pos-cash-change">
                    <span>Tiền thừa</span>
                    <strong>
                      {formatMoney(Math.max(0, cashReceivedAmount - total))}
                    </strong>
                  </div>
                  {cashReceivedAmount < total && (
                    <p className="pos-payment-hint error" role="alert">
                      Số tiền khách đưa chưa đủ.
                    </p>
                  )}
                </>
              )}
              {paymentMethod === "qr" && (
                <div className="pos-payment-placeholder">
                  <span className="pos-qr-illustration" aria-hidden="true">
                    <svg viewBox="0 0 64 64" fill="none">
                      <path d="M5 5h20v20H5zM39 5h20v20H39zM5 39h20v20H5z" />
                      <path d="M12 12h6v6h-6zM46 12h6v6h-6zM12 46h6v6h-6zM39 35h7v7h-7zM50 35h9v5h-9zM35 48h7v11h-7zM48 47h4v4h-4zM55 48h4v11h-4z" />
                    </svg>
                  </span>
                  <div>
                    <strong>Mã QR thanh toán</strong>
                    <p>Mã QR sẽ được tạo khi kết nối cổng thanh toán.</p>
                  </div>
                  <span className="pos-demo-label">Mô phỏng</span>
                </div>
              )}
              {paymentMethod === "card" && (
                <div className="pos-card-instructions">
                  <span className="pos-card-terminal" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="2.5" width="14" height="19" rx="2" />
                      <path d="M8 6h8M9 17h6M10 10h4" />
                    </svg>
                  </span>
                  <div>
                    <strong>Thanh toán qua thiết bị POS</strong>
                    <p>
                      Kết nối thiết bị để nhận trạng thái giao dịch. Bản demo
                      không xử lý thông tin thẻ thật.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <footer className="pos-checkout-actions">
              <button
                type="button"
                className="pos-checkout-cancel"
                onClick={handleClose}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="pos-checkout-confirm"
                disabled={paymentMethod === "cash" && !canConfirmCash}
                onClick={confirmPayment}
              >
                Xác nhận thanh toán
              </button>
            </footer>
          </>
        ) : (
          <>
            <header className="pos-checkout-success">
              <span aria-hidden="true">✓</span>
              <h2 id="pos-checkout-title">Thanh toán thành công</h2>
              <p>Giao dịch đã được ghi nhận trong bản mô phỏng.</p>
            </header>
            <div className="pos-receipt">
              <div className="pos-receipt-brand">
                <strong>{shopInfo.name || "OISM POS"}</strong>
                <span>HÓA ĐƠN BÁN HÀNG</span>
                {shopInfo.address && (
                  <small className="pos-receipt-shop-detail">
                    {shopInfo.address}
                  </small>
                )}
                {(shopInfo.phone || shopInfo.email) && (
                  <small className="pos-receipt-shop-detail">
                    {[shopInfo.phone, shopInfo.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                )}
              </div>
              <div className="pos-receipt-meta">
                <span>Mã đơn</span>
                <strong>{orderNumber}</strong>
                <span>Ngày giờ</span>
                <strong>
                  <time dateTime={orderDateTime}>
                    {formatReceiptDateTime(orderDateTime)}
                  </time>
                </strong>
                <span>Khách hàng</span>
                <strong>{selectedCustomer.name}</strong>
              </div>
              <div className="pos-receipt-items">
                {items.map((item) => (
                  <div key={item.id}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>{formatMoney(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <div className="pos-receipt-totals">
                <div>
                  <span>Tạm tính</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div>
                  <span>VAT (10%)</span>
                  <span>{formatMoney(vat)}</span>
                </div>
                {discount > 0 && (
                  <div>
                    <span>Giảm giá</span>
                    <span>−{formatMoney(discount)}</span>
                  </div>
                )}
                <div className="pos-receipt-grand-total">
                  <strong>Tổng cộng</strong>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </div>
              <p className="pos-receipt-payment">
                Thanh toán:{" "}
                {paymentMethod === "cash"
                  ? "Tiền mặt"
                  : paymentMethod === "qr"
                  ? "QR / Ví điện tử"
                  : "Thẻ"}
              </p>
              <p className="pos-receipt-thanks">Cảm ơn quý khách!</p>
            </div>
            <footer className="pos-checkout-actions">
              <button
                type="button"
                className="pos-checkout-cancel"
                onClick={handleClose}
              >
                Đóng
              </button>
              <button
                type="button"
                className="pos-checkout-confirm"
                onClick={() => window.print()}
              >
                In hóa đơn
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export default CartCheckoutModal;
