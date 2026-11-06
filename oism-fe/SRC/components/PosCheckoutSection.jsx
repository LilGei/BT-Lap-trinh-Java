import { useState } from "react";
import formatCurrency from "../utils/formatCurrency";
import "../styles/PosCheckoutSection.css";

const VAT_RATE = 0.1;
const DISCOUNT_AMOUNT = 0;

function PosCheckoutSection({ cart }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const subtotal = cart.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat - DISCOUNT_AMOUNT;

  return (
    <section
      className="pos-checkout"
      aria-label="Tổng kết đơn hàng và phương thức thanh toán"
    >
      <div className="pos-checkout__amount">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="pos-checkout__amount">
        <span>VAT (10%)</span>
        <span>{formatCurrency(vat)}</span>
      </div>
      <div className="pos-checkout__amount">
        <span>Discount</span>
        <span>-{formatCurrency(DISCOUNT_AMOUNT)}</span>
      </div>
      <div className="pos-checkout__total">
        <strong>Total</strong>
        <strong>{formatCurrency(total)}</strong>
      </div>

      <button className="pos-checkout__coupon" type="button">
        <span aria-hidden="true">%</span>
        Apply discount/ coupon
      </button>

      <span className="pos-checkout__method-label">
        Phương thức thanh toán
      </span>
      <div className="pos-checkout__methods">
        {[
          { id: "card", label: "Card", icon: "▣" },
          { id: "cash", label: "Cash", icon: "₫" },
          { id: "wallet", label: "Digital wallet", icon: "▤" },
          { id: "split", label: "Split payment", icon: "⇄" },
        ].map((method) => (
          <button
            className={`pos-checkout__method${
              paymentMethod === method.id
                ? " pos-checkout__method--active"
                : ""
            }`}
            key={method.id}
            type="button"
            aria-pressed={paymentMethod === method.id}
            onClick={() => setPaymentMethod(method.id)}
          >
            <span aria-hidden="true">{method.icon}</span>
            {method.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default PosCheckoutSection;