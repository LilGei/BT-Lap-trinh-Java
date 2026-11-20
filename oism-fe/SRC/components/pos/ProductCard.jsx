import formatMoney from "./formatMoney";
import "../../styles/ProductCard.css";

function ProductCard({ product, quantityInCart, onAdd }) {
  const available = Math.max(
    0,
    product.onHand - product.reserved - quantityInCart
  );
  const stockStatus =
    available === 0 ? "out" : available <= 5 ? "low" : "available";
  const stockLabel =
    stockStatus === "out"
      ? "Hết hàng"
      : stockStatus === "low"
      ? `Sắp hết · Còn ${available}`
      : `Còn hàng · ${available}`;

  return (
    <article className="pos-product-card">
      <div
        className="pos-product-image"
        style={{ backgroundColor: product.background }}
        aria-hidden="true"
      >
        {product.icon}
      </div>
      <div className="pos-product-info">
        <h2 className="pos-product-name">{product.name}</h2>
        <p className="pos-product-sku">{product.sku}</p>
        <div className="pos-product-stock-row">
          <div className="pos-product-stock-info">
            <span className={`pos-stock-badge ${stockStatus}`}>
              {stockLabel}
            </span>
          </div>
          <button
            type="button"
            className="pos-add-product-button"
            onClick={() => onAdd(product)}
            disabled={available === 0}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            title={
              available === 0
                ? "Đã hết tồn khả dụng"
                : `Thêm ${product.name} vào giỏ`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <strong className="pos-product-price">
          {formatMoney(product.price)}
        </strong>
      </div>
    </article>
  );
}

export default ProductCard;
