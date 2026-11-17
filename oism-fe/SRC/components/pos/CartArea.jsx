const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

function CartArea() {
  return (
    <section className="pos-cart-area" aria-labelledby="pos-cart-title">
      <header className="pos-cart-header">
        <div>
          <h2 id="pos-cart-title">Giỏ hàng</h2>
          <p>Đơn hàng mới</p>
        </div>
        <span className="pos-cart-count">0 món</span>
      </header>

      <div className="pos-cart-empty">
        <span className="pos-cart-empty-icon" aria-hidden="true">
          +
        </span>
        <strong>Chưa có sản phẩm</strong>
        <p>Chọn sản phẩm để thêm vào giỏ hàng.</p>
      </div>

      <div className="pos-cart-summary">
        <div>
          <span>Tạm tính</span>
          <strong>{formatMoney(0)}</strong>
        </div>
        <div>
          <span>Giảm giá</span>
          <strong>{formatMoney(0)}</strong>
        </div>
        <div className="pos-cart-total">
          <span>Tổng thanh toán</span>
          <strong>{formatMoney(0)}</strong>
        </div>
        <button type="button" className="pos-checkout-button" disabled>
          Thanh toán
        </button>
      </div>
    </section>
  );
}

export default CartArea;
