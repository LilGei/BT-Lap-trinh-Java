import { useEffect, useState } from "react";
import ProductArea from "@/presentation/components/pos/ProductArea";
import CartArea from "@/presentation/components/pos/CartArea";
import HeaderPos from "@/presentation/components/pos/HeaderPos";
import PosOnlineOrderNotification from "@/presentation/components/pos/PosOnlineOrderNotification";
import PosOrderHistory from "@/presentation/components/pos/PosOrderHistory";
import mockProducts from "@/presentation/components/pos/mockProducts";
import "@/presentation/styles/PosPage.css";

const shopInfoStorageKey = "oism-pos-shop-info";
const posOrderHistoryStorageKey = "oism-pos-sales-history";
const defaultShopInfo = {
  name: "OISM POS",
  address: "",
  phone: "",
  email: "",
};

function loadPosOrderHistory() {
  try {
    const savedOrders = window.localStorage.getItem(posOrderHistoryStorageKey);
    if (!savedOrders) return [];

    const parsedOrders = JSON.parse(savedOrders);
    if (!Array.isArray(parsedOrders)) {
      throw new TypeError("Saved POS order history must be an array.");
    }

    return parsedOrders.filter(
      (order) =>
        order &&
        typeof order.id === "string" &&
        typeof order.createdAt === "string" &&
        Number.isFinite(Date.parse(order.createdAt)) &&
        order.customer &&
        typeof order.customer.name === "string" &&
        Array.isArray(order.items) &&
        order.items.every(
          (item) =>
            item &&
            (typeof item.id === "string" || typeof item.id === "number") &&
            typeof item.name === "string" &&
            typeof item.sku === "string" &&
            Number.isFinite(item.price) &&
            Number.isFinite(item.quantity)
        ) &&
        Number.isFinite(order.total)
    );
  } catch (error) {
    console.error("Unable to read saved POS order history.", error);
    return [];
  }
}

function loadShopInfo() {
  try {
    const savedShopInfo = window.localStorage.getItem(shopInfoStorageKey);
    if (!savedShopInfo) return defaultShopInfo;

    const parsedShopInfo = JSON.parse(savedShopInfo);
    if (
      !parsedShopInfo ||
      typeof parsedShopInfo !== "object" ||
      Array.isArray(parsedShopInfo)
    ) {
      throw new TypeError("Saved shop information has an invalid shape.");
    }

    return {
      name:
        typeof parsedShopInfo.name === "string"
          ? parsedShopInfo.name
          : defaultShopInfo.name,
      address:
        typeof parsedShopInfo.address === "string"
          ? parsedShopInfo.address
          : defaultShopInfo.address,
      phone:
        typeof parsedShopInfo.phone === "string"
          ? parsedShopInfo.phone
          : defaultShopInfo.phone,
      email:
        typeof parsedShopInfo.email === "string"
          ? parsedShopInfo.email
          : defaultShopInfo.email,
    };
  } catch (error) {
    console.error("Unable to read saved POS shop settings.", error);
    return defaultShopInfo;
  }
}

function PosPage() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState(mockProducts);
  const [shopInfo, setShopInfo] = useState(loadShopInfo);
  const [posOrders, setPosOrders] = useState(loadPosOrderHistory);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        posOrderHistoryStorageKey,
        JSON.stringify(posOrders)
      );
    } catch (error) {
      console.error("Unable to save POS order history.", error);
    }
  }, [posOrders]);

  const handleShopInfoSave = (nextShopInfo) => {
    try {
      window.localStorage.setItem(
        shopInfoStorageKey,
        JSON.stringify(nextShopInfo)
      );
    } catch (error) {
      console.error("Unable to save POS shop settings.", error);
      return false;
    }

    setShopInfo(nextShopInfo);
    return true;
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;

    const shouldClear = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?"
    );
    if (shouldClear) setCartItems([]);
  };

  const handleAddProduct = (product) => {
    const currentItem = cartItems.find((item) => item.id === product.id);
    const available = product.onHand - product.reserved;

    if ((currentItem?.quantity ?? 0) >= available) return false;

    setCartItems((currentItems) => {
      const itemInCurrentCart = currentItems.find(
        (item) => item.id === product.id
      );

      if (itemInCurrentCart) {
        if (itemInCurrentCart.quantity >= available) return currentItems;

        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
    return true;
  };

  const handlePaymentComplete = (order) => {
    const soldQuantities = new Map(
      order.items.map((item) => [item.id, item.quantity])
    );

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const soldQuantity = soldQuantities.get(product.id);
        if (!soldQuantity) return product;

        return { ...product, onHand: product.onHand - soldQuantity };
      })
    );
    setPosOrders((currentOrders) => [order, ...currentOrders]);
  };

  return (
    <div className="pos-page-shell">
      <HeaderPos
        onClearCart={handleClearCart}
        onHistory={() => setHistoryOpen((isOpen) => !isOpen)}
        historyOpen={historyOpen}
        cartIsEmpty={cartItems.length === 0}
        shopInfo={shopInfo}
        onShopInfoSave={handleShopInfoSave}
      />
      <PosOnlineOrderNotification />
      {historyOpen ? (
        <PosOrderHistory orders={posOrders} />
      ) : (
        <div className="pos-page">
          <ProductArea
            products={products}
            cartItems={cartItems}
            onAddProduct={handleAddProduct}
          />
          <CartArea
            cartItems={cartItems}
            setCartItems={setCartItems}
            onPaymentComplete={handlePaymentComplete}
            shopInfo={shopInfo}
          />
        </div>
      )}
    </div>
  );
}

export default PosPage;
