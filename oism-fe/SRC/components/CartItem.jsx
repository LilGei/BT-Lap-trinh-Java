import { useState } from "react";
import formatCurrency from "../utils/formatCurrency";
import "../styles/CartItem.css";

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { product, quantity } = item;
  const available = product.onHand - product.reserved;

  return (
    <article className="cart-item">
      <div className="cart-item__image">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">
            {product.imageFallback ?? product.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="cart-item__content">
        <div className="cart-item__details">
          <h3>{product.name}</h3>
          <span>SKU: {product.sku}</span>
        </div>

        <div className="cart-item__footer">
          <div className="cart-item__quantity" aria-label="Số lượng">
            <button
              type="button"
              aria-label={`Giảm số lượng ${product.name}`}
              disabled={quantity <= 1}
              onClick={() => onDecrease(product.id)}
            >
              −
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label={`Tăng số lượng ${product.name}`}
              disabled={quantity >= available}
              onClick={() => onIncrease(product)}
            >
              +
            </button>
          </div>
          <span className="cart-item__stock">Còn {available}</span>
        </div>
      </div>

      <div className="cart-item__actions">
        <strong className="cart-item__price">
          {formatCurrency(product.price * quantity)}
        </strong>
        <button
          className="cart-item__remove"
          type="button"
          aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
          onClick={() => onRemove(product.id)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </article>
  );
}

export default CartItem;
