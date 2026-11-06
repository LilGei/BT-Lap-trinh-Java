import PosCustomerSection from "./PosCustomerSection";
import CartItem from "./CartItem";
import "../styles/CartPanel.css";

function CartPanel({
  cart,
  customer,
  onCustomerChange,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <aside className="pos-cart" aria-labelledby="pos-cart-title">
      <div className="pos-cart__heading">
        <div>
          <span className="pos-section-heading__eyebrow">
            ĐƠN HÀNG HIỆN TẠI
          </span>
          <h2 id="pos-cart-title">Giỏ hàng</h2>
        </div>
        <span className="pos-cart__item-count">{itemCount} món</span>
      </div>

      <div className="pos-cart__order">
        <span>Mã đơn</span>
        <strong>Đơn mới</strong>
      </div>

      <PosCustomerSection
        customer={customer}
        onCustomerChange={onCustomerChange}
      />

      <div className="pos-cart__items">
        {cart.length === 0 ? (
          <div className="pos-cart__empty">
            <span className="pos-cart__empty-icon" aria-hidden="true">
              +
            </span>
            <strong>Chưa có sản phẩm</strong>
            <span>Chọn sản phẩm để bắt đầu tạo đơn hàng</span>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default CartPanel;
