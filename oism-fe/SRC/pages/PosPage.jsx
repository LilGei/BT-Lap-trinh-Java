import { useState } from "react";
import PosCategoryFilter from "../components/PosCategoryFilter";
import PosHeader from "../components/PosHeader";
import PosProductCard from "../components/PosProductCard";
import PosProductSearch from "../components/PosProductSearch";
import PosSidebar from "../components/PosSidebar";
import "../styles/PosPage.css";
import formatCurrency from "../utils/formatCurrency";
import { mockProducts } from "../utils/mockData";

function PosPage() {
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Products");

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

            <PosProductSearch
              value={productSearch}
              onChange={setProductSearch}
            />

            <PosCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="pos-product-grid">
              {mockProducts.map((product) => (
                <PosProductCard key={product.id} product={product} />
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