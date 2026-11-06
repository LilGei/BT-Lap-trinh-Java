import { useState } from "react";
import formatCurrency from "../utils/formatCurrency";
import "../styles/PosProductCard.css";

function PosProductCard({ product, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);
  const available = product.onHand - product.reserved;
  const isOutOfStock = available <= 0;
  const stockStatus = isOutOfStock
    ? "pos-product-card__stock--empty"
    : available <= product.lowStockThreshold
      ? "pos-product-card__stock--low"
      : "pos-product-card__stock--available";

  return (
    <article className="pos-product-card">
      <div className="pos-product-card__media">
        {product.image && !imageFailed ? (
          <img
            className="pos-product-card__image"
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="pos-product-card__image-fallback" aria-hidden="true">
            {product.imageFallback ?? product.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="pos-product-card__details">
        <span className="pos-product-card__category">{product.category}</span>
        <h3>{product.name}</h3>
        <span className="pos-product-card__sku">SKU: {product.sku}</span>
      </div>

      <div className="pos-product-card__footer">
        <strong className="pos-product-card__price">
          {formatCurrency(product.price)}
        </strong>
        <span className={`pos-product-card__stock ${stockStatus}`}>
          {isOutOfStock ? "Hết hàng" : `Còn ${available}`}
        </span>
      </div>

      <button
        className="pos-product-card__add"
        type="button"
        disabled={isOutOfStock}
        onClick={() => onAdd?.(product)}
      >
        <span aria-hidden="true">+</span>
        {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
      </button>
    </article>
  );
}

export default PosProductCard;