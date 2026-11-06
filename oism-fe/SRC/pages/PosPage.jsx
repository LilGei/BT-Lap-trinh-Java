import PosHeader from "../components/PosHeader";
import PosSidebar from "../components/PosSidebar";
import "../styles/PosPage.css";
import { mockProducts } from "../utils/mockData";

const formatCurrency = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;

function ProductCard({ product }) {
  const available = product.onHand - product.reserved;
  const stockStatus =
    available === 0
      ? "pos-product-card__stock--empty"
      : available <= product.lowStockThreshold
        ? "pos-product-card__stock--low"
        : "pos-product-card__stock--available";

  return (
    <article className="pos-product-card">
      <div className="pos-product-card__image" aria-hidden="true">
        {product.name.charAt(0)}
      </div>
      <div className="pos-product-card__details">
        <span className="pos-product-card__category">{product.category}</span>
        <h3>{product.name}</h3>
        <span className="pos-product-card__sku">SKU: {product.sku}</span>
      </div>
      <div className="pos-product-card__footer">
        <strong>{formatCurrency(product.price)}</strong>
        <span className={`pos-product-card__stock ${stockStatus}`}>
          Còn {available}
        </span>
      </div>
    </article>
  );
}

function PosPage() {
  return (
    <div className="pos-page">
      <PosHeader />
      <div className="pos-workspace">
        <PosSidebar />
        <main className="pos-layout">
          <section className="pos-products" aria-labelledby="pos-products-title">
            <div className="pos-section-heading">
              <div>
                <span className="pos-section-heading__eyebrow">BÁN HÀNG</span>
                <h1 id="pos-products-title">Sản phẩm</h1>
              </div>
              <span className="pos-products__count">
                {mockProducts.length} sản phẩm
              </span>
            </div>

            <div className="pos-product-grid">
              {mockProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <aside className="pos-cart" aria-labelledby="pos-cart-title">
            <div className="pos-cart__heading">
              <div>
                <span className="pos-section-heading__eyebrow">
                  ĐƠN HÀNG HIỆN TẠI
                </span>
                <h2 id="pos-cart-title">Giỏ hàng</h2>
              </div>
              <span className="pos-cart__item-count">0 món</span>
            </div>

            <div className="pos-cart__order">
              <span>Mã đơn</span>
              <strong>Đơn mới</strong>
            </div>

            <div className="pos-cart__empty">
              <span className="pos-cart__empty-icon" aria-hidden="true">
                +
              </span>
              <strong>Chưa có sản phẩm</strong>
              <span>Chọn sản phẩm để bắt đầu tạo đơn hàng</span>
            </div>

            <div className="pos-cart__summary">
              <div>
                <span>Tạm tính</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div>
                <span>Giảm giá</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="pos-cart__total">
                <strong>Tổng cộng</strong>
                <strong>{formatCurrency(0)}</strong>
              </div>
              <button className="pos-cart__checkout" type="button" disabled>
                Thanh toán
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default PosPage;