import { useState } from "react";
import PosCategoryFilter from "../components/PosCategoryFilter";
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
                <PosProductCard
                  key={product.id}
                  product={product}
                  onAdd={addProductToCart}
                />
              ))}
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