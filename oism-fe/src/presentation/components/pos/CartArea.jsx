import { useCallback, useEffect, useState } from "react";
import CartCheckoutModal from "./CartCheckoutModal";
import CartCustomer from "./CartCustomer";
import formatMoney from "./formatMoney";
import "@/presentation/styles/CartArea.css";

function CartArea({
  cartItems,
  setCartItems,
  onPaymentComplete,
  shopInfo,
}) {
  const [cartMessage, setCartMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState({
    id: "walk-in",
    name: "Walk-in Customer",
    phone: "",
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const vat = Math.round(subtotal * 0.1);
  const discount = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + vat - discount;

  useEffect(() => {
    if (cartItems.length !== 0) return;

    setDiscountApplied(false);
    setDiscountCode("");
    setDiscountError("");
    setShowDiscountInput(false);
    setCartMessage("");
  }, [cartItems.length]);

  useEffect(() => {
    const handleCheckoutShortcut = (event) => {
      if (event.key !== "F1") return;

      event.preventDefault();
      if (cartItems.length === 0) {
        setCartMessage(
          "Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi thanh toán."
        );
        return;
      }

      setCartMessage("");
      setCheckoutOpen(true);
    };

    window.addEventListener("keydown", handleCheckoutShortcut);
    return () => window.removeEventListener("keydown", handleCheckoutShortcut);
  }, [cartItems.length]);

  const handleCustomerChange = useCallback((customer) => {
    setSelectedCustomer(customer);
  }, []);

  const changeQuantity = (itemId, amount) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId);
    if (!item) return;

    const available = item.onHand - item.reserved;
    if (amount > 0 && item.quantity >= available) {
      setCartMessage(`Không thể thêm "${item.name}": đã đạt tồn khả dụng.`);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: Math.max(1, cartItem.quantity + amount) }
          : cartItem
      )
    );
    setCartMessage("");
  };

  const removeCartItem = (itemId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
    setCartMessage("");
  };

  const applyDiscountCode = (event) => {
    event.preventDefault();
    if (discountCode.trim().toUpperCase() !== "OISM10") {
      setDiscountError("Mã không hợp lệ. Thử mã OISM10.");
      return;
    }

    setDiscountApplied(true);
    setDiscountError("");
    setShowDiscountInput(false);
  };

  const closeCheckout = useCallback(
    (completed) => {
      if (completed) {
        setCartItems([]);
        setDiscountApplied(false);
        setDiscountCode("");
        setShowDiscountInput(false);
      }
      setCheckoutOpen(false);
    },
    [setCartItems]
  );

  return (
    <section className="cart-container" aria-label="Giỏ hàng">
      <header className="cart-panel-header">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 4h2l2.4 11.5h11.3L21 8H6.1" />
          <circle cx="9.5" cy="19" r="1.3" />
          <circle cx="17.5" cy="19" r="1.3" />
        </svg>
        <h2>Giỏ hàng</h2>
      </header>

      <CartCustomer onCustomerChange={handleCustomerChange} />

      <section className="cart-items-section" aria-label="Sản phẩm trong giỏ">
        <h3 className="cart-items-heading">Cart Items</h3>
        <div className="cart-items-list">
          {cartItems.map((item) => (
            <article className="cart-item" key={item.id}>
              <img className="cart-item-image" src={item.image} alt="" />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <span>{item.sku}</span>
              </div>
              <div className="cart-item-actions">
                <strong className="cart-item-price">
                  {formatMoney(item.price)}
                </strong>
                <div className="cart-item-controls">
                  <button
                    type="button"
                    className="cart-quantity-button"
                    onClick={() => changeQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Giảm số lượng ${item.name}`}
                  >
                    −
                  </button>
                  <span className="cart-item-quantity" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="cart-quantity-button"
                    onClick={() => changeQuantity(item.id, 1)}
                    aria-label={`Tăng số lượng ${item.name}`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="cart-remove-button"
                    onClick={() => removeCartItem(item.id)}
                    aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                    title="Xóa sản phẩm"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
          {cartItems.length === 0 && (
            <div className="cart-empty">
              <strong>Chưa có sản phẩm</strong>
              <p>Chọn sản phẩm để thêm vào giỏ hàng.</p>
            </div>
          )}
        </div>
        {cartMessage && (
          <p className="cart-stock-message" role="alert">
            {cartMessage}
          </p>
        )}
      </section>

      <section className="cart-summary-section" aria-label="Tóm tắt hóa đơn">
        <div className="cart-summary-row">
          <span>Tạm tính</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div className="cart-summary-row">
          <span>VAT (10%)</span>
          <strong>{formatMoney(vat)}</strong>
        </div>
        <div className="cart-summary-row cart-discount-row">
          <span>Giảm giá</span>
          {discountApplied ? (
            <strong className="cart-discount-applied">
              −{formatMoney(discount)}
              <button
                type="button"
                onClick={() => {
                  setDiscountApplied(false);
                  setDiscountCode("");
                }}
              >
                Gỡ
              </button>
            </strong>
          ) : (
            <button
              type="button"
              className="cart-discount-trigger"
              onClick={() => {
                setShowDiscountInput((isOpen) => !isOpen);
                setDiscountError("");
              }}
              aria-expanded={showDiscountInput}
            >
              + Thêm mã
            </button>
          )}
        </div>
        {showDiscountInput && (
          <form className="cart-discount-form" onSubmit={applyDiscountCode}>
            <input
              type="text"
              value={discountCode}
              onChange={(event) => setDiscountCode(event.target.value)}
              placeholder="Nhập mã giảm giá"
              aria-label="Mã giảm giá"
              autoFocus
            />
            <button type="submit">Áp dụng</button>
            {discountError && (
              <p className="cart-discount-error" role="alert">
                {discountError}
              </p>
            )}
          </form>
        )}
        <div className="cart-total-row">
          <span>Tổng cộng</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <button
          type="button"
          className="btn-checkout"
          disabled={cartItems.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Thanh toán
        </button>
      </section>

      {checkoutOpen && (
        <CartCheckoutModal
          items={cartItems}
          subtotal={subtotal}
          vat={vat}
          discount={discount}
          total={total}
          selectedCustomer={selectedCustomer}
          shopInfo={shopInfo}
          onPaymentComplete={onPaymentComplete}
          onClose={closeCheckout}
        />
      )}
    </section>
  );
}

export default CartArea;
