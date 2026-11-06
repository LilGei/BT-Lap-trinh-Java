import PosCustomerSection from "./PosCustomerSection";
import CartItem from "./CartItem";
import PosCheckoutSection from "./PosCheckoutSection";
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
    <aside className="pos-cart" aria-label="Giỏ hàng">
      <PosCustomerSection
        customer={customer}
        onCustomerChange={onCustomerChange}
      />

      <div className="pos-cart__items-meta">
        <span>Sản phẩm trong giỏ</span>
        <span className="pos-cart__item-count">{itemCount} món</span>
      </div>

      <div className="pos-cart__items">
        {cart.length === 0 ? (
          <div className="pos-cart__empty">
            <strong>Chưa có sản phẩm</strong>
            <span>Chọn sản phẩm để thêm vào đơn</span>
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

      <PosCheckoutSection cart={cart} />
    </aside>
  );
}

export default CartPanel;
