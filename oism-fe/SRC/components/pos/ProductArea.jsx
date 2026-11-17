import { useRef, useState } from "react";
import "../../styles/ProductArea.css";

const products = [
  {
    id: 1,
    name: "Áo thun nam Basic",
    category: "Clothing",
    sku: "AT-001-M",
    barcode: "8930000000011",
    price: 150000,
    onHand: 22,
    reserved: 3,
  },
  {
    id: 2,
    name: "Quần jean nữ",
    category: "Clothing",
    sku: "QJ-002-32",
    barcode: "8930000000035",
    price: 350000,
    onHand: 8,
    reserved: 3,
  },
  {
    id: 3,
    name: "Tai nghe Bluetooth",
    category: "Electronics",
    sku: "SKU-003",
    barcode: "8930000000042",
    price: 425000,
    onHand: 0,
    reserved: 0,
  },
  {
    id: 4,
    name: "Bình giữ nhiệt 500ml",
    category: "Home & Living",
    sku: "SKU-004",
    barcode: "8930000000059",
    price: 185000,
    onHand: 4,
    reserved: 1,
  },
  {
    id: 5,
    name: "Chuột không dây",
    category: "Electronics",
    sku: "SKU-005",
    barcode: "8930000000066",
    price: 220000,
    onHand: 15,
    reserved: 0,
  },
  {
    id: 6,
    name: "Balo laptop",
    category: "Accessories",
    sku: "SKU-006",
    barcode: "8930000000073",
    price: 490000,
    onHand: 2,
    reserved: 1,
  },
];

const categories = [
  "All Products",
  "Electronics",
  "Clothing",
  "Home & Living",
  "Accessories",
];

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

function ProductArea() {
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const searchInputRef = useRef(null);

  const filteredProducts = products.filter((product) => {
    const searchTerm = keyword.trim().toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      product.barcode.toLowerCase().includes(searchTerm);
    const matchesCategory =
      activeCategory === "All Products" ||
      product.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section className="pos-product-area" aria-label="Danh sách sản phẩm">
      <div className="pos-search" role="search">
        <span aria-hidden="true">⌕</span>
        <input
          ref={searchInputRef}
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm tên, SKU hoặc quét barcode..."
          aria-label="Tìm sản phẩm theo tên, SKU hoặc barcode"
          autoCapitalize="off"
          autoFocus
          spellCheck={false}
        />
        <button
          type="button"
          className="pos-scan-button"
          aria-label="Quét barcode"
          title="Quét barcode"
          onClick={() => searchInputRef.current?.focus()}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
            <path d="M8 9v6M11 8v8M14 9v6M17 8v8" />
          </svg>
        </button>
      </div>

      <nav className="pos-category-tabs" aria-label="Lọc sản phẩm theo danh mục">
        {categories.map((category) => (
          <button
            className={`pos-category-tab ${
              activeCategory === category ? "active" : ""
            }`}
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="pos-product-grid">
        {filteredProducts.map((product) => {
          const available = product.onHand - product.reserved;
          const stockStatus =
            available === 0
              ? "out"
              : available <= 5
              ? "low"
              : "available";
          const stockLabel =
            stockStatus === "out"
              ? "Hết hàng"
              : stockStatus === "low"
              ? `Sắp hết · Còn ${available}`
              : `Còn hàng · ${available}`;

          return (
            <article className="pos-product-card" key={product.id}>
              <div className="pos-product-placeholder" aria-hidden="true">
                {product.name.charAt(0)}
              </div>
              <div className="pos-product-info">
                <span className={`pos-stock-badge ${stockStatus}`}>
                  {stockLabel}
                </span>
                <h2>{product.name}</h2>
                <p className="pos-product-sku">{product.sku}</p>
                <strong>{formatMoney(product.price)}</strong>
              </div>
            </article>
          );
        })}
        {filteredProducts.length === 0 && (
          <p className="pos-empty-products">Không tìm thấy sản phẩm phù hợp.</p>
        )}
      </div>
    </section>
  );
}

export default ProductArea;
