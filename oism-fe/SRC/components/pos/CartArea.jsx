import { useCallback, useState } from "react";
import CartCheckoutModal from "./CartCheckoutModal";
import CartCustomer from "./CartCustomer";
import formatMoney from "./formatMoney";
import "../../styles/CartArea.css";

const initialCartItems = [
  {
    id: 1,
    name: "Áo thun nam Basic",
    sku: "AT-001-M",
    price: 150000,
    image: "👕",
    onHand: 22,
    reserved: 3,
    quantity: 2,
  },
  {
    id: 2,
    name: "Quần jean nữ",
    sku: "QJ-002-32",
    price: 350000,
    image: "👖",
    onHand: 8,
    reserved: 3,
    quantity: 1,
  },
  {
    id: 5,
    name: "Chuột không dây",
    sku: "SKU-005",
    price: 220000,
    image: "🖱",
    onHand: 15,
    reserved: 0,
    quantity: 1,
  },
];

function CartArea() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [stockMessage, setStockMessage] = useState("");
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

  const handleCustomerChange = useCallback((customer) => {
    setSelectedCustomer(customer);
  }, []);

  const changeQuantity = (itemId, amount) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId);
    if (!item) return;

    const available = item.onHand - item.reserved;
    if (amount > 0 && item.quantity >= available) {
      setStockMessage(`Không thể thêm "${item.name}": đã đạt tồn khả dụng.`);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: Math.max(1, cartItem.quantity + amount) }
          : cartItem
      )
    );
    setStockMessage("");
  };

  const removeCartItem = (itemId) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
    setStockMessage("");
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

  const closeCheckout = (completed) => {
    if (completed) {
      setCartItems([]);
      setDiscountApplied(false);
      setDiscountCode("");
      setShowDiscountInput(false);
    }
    setCheckoutOpen(false);
  };

  return (
    <section className="pos-cart-area" aria-label="Giỏ hàng">
      <header className="pos-cart-header">
        <div className="pos-cart-heading">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 4h2l2.4 11.5h11.3L21 8H6.1" />
            <circle cx="9.5" cy="19" r="1.3" />
            <circle cx="17.5" cy="19" r="1.3" />
          </svg>
          <h2 className="pos-cart-title">Giỏ hàng</h2>
        </div>
      </header>

      <CartCustomer onCustomerChange={handleCustomerChange} />

      <div className="pos-cart-items" aria-label="Danh sách sản phẩm trong giỏ">
        {cartItems.map((item) => (
          <article className="pos-cart-item" key={item.id}>
            <div className="pos-cart-item-image" aria-hidden="true">
              {item.image}
            </div>
            <div className="pos-cart-item-content">
              <div className="pos-cart-item-details">
                <div className="pos-cart-item-title">
                  <h3>{item.name}</h3>
                  <p>{item.sku}</p>
                </div>
                <strong className="pos-cart-item-price">
                  {formatMoney(item.price)}
                </strong>
              </div>
              <div className="pos-cart-item-footer">
                <button
                  type="button"
                  className="pos-quantity-button"
                  onClick={() => changeQuantity(item.id, -1)}
                  disabled={item.quantity <= 1}
                  aria-label={`Giảm số lượng ${item.name}`}
                >
                  −
                </button>
                <span className="pos-cart-item-quantity" aria-live="polite">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="pos-quantity-button"
                  onClick={() => changeQuantity(item.id, 1)}
                  aria-label={`Tăng số lượng ${item.name}`}
                >
                  +
                </button>
                <button
                  type="button"
                  className="pos-remove-cart-item"
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
          <div className="pos-cart-empty">
            <span className="pos-cart-empty-icon" aria-hidden="true">
              +
            </span>
            <strong>Chưa có sản phẩm</strong>
            <p>Chọn sản phẩm để thêm vào giỏ hàng.</p>
          </div>
        )}
      </div>
      {stockMessage && (
        <p className="pos-stock-message" role="alert">
          {stockMessage}
        </p>
      )}

      <div className="pos-cart-summary">
        <div>
          <span>Tạm tính</span>
          <strong>{formatMoney(subtotal)}</strong>
        </div>
        <div>
          <span>VAT (10%)</span>
          <strong>{formatMoney(vat)}</strong>
        </div>
        <div className="pos-cart-discount-row">
          <span>Giảm giá</span>
          {discountApplied ? (
            <strong className="pos-discount-applied">
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
              className="pos-discount-trigger"
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
          <form className="pos-discount-form" onSubmit={applyDiscountCode}>
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
              <p className="pos-discount-error" role="alert">
                {discountError}
              </p>
            )}
          </form>
        )}
        <div className="pos-cart-total">
          <span>Tổng cộng</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <button
          type="button"
          className="pos-checkout-button"
          disabled={cartItems.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Thanh toán
        </button>
      </div>

      {checkoutOpen && (
        <CartCheckoutModal
          items={cartItems}
          subtotal={subtotal}
          vat={vat}
          discount={discount}
          total={total}
          selectedCustomer={selectedCustomer}
          onClose={closeCheckout}
        />
      )}
    </section>
  );
}

export default CartArea;
