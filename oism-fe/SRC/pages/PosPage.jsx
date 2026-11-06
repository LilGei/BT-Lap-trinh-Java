import { useState } from "react";
import PosCategoryFilter, {
  productCategories,
} from "../components/PosCategoryFilter";
import CartPanel from "../components/CartPanel";
import PosHeader from "../components/PosHeader";
import PosProductCard from "../components/PosProductCard";
import PosProductSearch from "../components/PosProductSearch";
import PosSidebar from "../components/PosSidebar";
import "../styles/PosPage.css";
import { mockProducts } from "../utils/mockData";

function PosPage() {
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [selectedCustomer, setSelectedCustomer] =
    useState("Walk-in Customer");
  const [cart, setCart] = useState([]);
  const normalizedSearch = productSearch.trim().toLocaleLowerCase("vi");
  const filteredProducts = mockProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === productCategories[0] ||
      product.category === selectedCategory;
    const searchableFields = [product.name, product.sku, product.barcode];
    const matchesSearch = searchableFields.some((field) =>
      field.toLocaleLowerCase("vi").includes(normalizedSearch)
    );

    return matchesCategory && matchesSearch;
  });

  const addProductToCart = (product) => {
    const available = product.onHand - product.reserved;
    const currentQuantity =
      cart.find((item) => item.product.id === product.id)?.quantity ?? 0;

    if (currentQuantity >= available) {
      window.alert(
        `Không thể thêm "${product.name}". Số lượng khả dụng tối đa là ${available}.`
      );
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const decreaseCartItem = (productId) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        if (item.quantity <= 1) return [];
        return [{ ...item, quantity: item.quantity - 1 }];
      })
    );
  };

  const removeCartItem = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product.id !== productId)
    );
  };

  return (
    <div className="pos-page">
      <PosHeader />
      <div className="pos-workspace">
        <PosSidebar />
        <main className="pos-layout">
          <section className="pos-products" aria-label="Danh sách sản phẩm">
            <PosProductSearch
              value={productSearch}
              onChange={setProductSearch}
            />

            <PosCategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="pos-products__summary" aria-live="polite">
              {filteredProducts.length} kết quả
            </div>

            <div className="pos-product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <PosProductCard
                    key={product.id}
                    product={product}
                    onAdd={addProductToCart}
                  />
                ))
              ) : (
                <p className="pos-products__empty">
                  Không tìm thấy sản phẩm phù hợp.
                </p>
              )}
            </div>
          </section>

          <CartPanel
            cart={cart}
            customer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onIncrease={addProductToCart}
            onDecrease={decreaseCartItem}
            onRemove={removeCartItem}
          />
        </main>
      </div>
    </div>
  );
}

export default PosPage;