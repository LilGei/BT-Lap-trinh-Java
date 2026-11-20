import { useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import mockProducts from "./mockProducts";
import "../../styles/ProductArea.css";

const categories = [
  "All Products",
  ...new Set(mockProducts.map((product) => product.category)),
];

function ProductArea({ products, cartItems, onAddProduct }) {
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [addMessage, setAddMessage] = useState("");
  const searchInputRef = useRef(null);

  const searchTerm = keyword.trim().toLowerCase();
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          product.barcode.toLowerCase().includes(searchTerm);
        const matchesCategory =
          activeCategory === "All Products" ||
          product.category === activeCategory;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, activeCategory]
  );
  const cartQuantitiesByProductId = new Map(
    cartItems.map((item) => [item.id, item.quantity])
  );

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
          return (
            <ProductCard
              product={product}
              key={product.id}
              quantityInCart={cartQuantitiesByProductId.get(product.id) ?? 0}
              onAdd={(selectedProduct) => {
                const added = onAddProduct(selectedProduct);
                setAddMessage(
                  {
                    text: added
                      ? `Đã thêm "${selectedProduct.name}" vào giỏ.`
                      : `Không thể thêm "${selectedProduct.name}": đã đạt tồn khả dụng.`,
                    success: added,
                  }
                );
              }}
            />
          );
        })}
        {filteredProducts.length === 0 && (
          <p className="pos-empty-products">Không tìm thấy sản phẩm phù hợp.</p>
        )}
      </div>
      {addMessage && (
        <p
          className={`pos-add-product-feedback ${
            addMessage.success ? "success" : "error"
          }`}
          role={addMessage.success ? "status" : "alert"}
        >
          {addMessage.text}
        </p>
      )}
    </section>
  );
}

export default ProductArea;
