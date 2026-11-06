import { Routes, Route } from "react-router-dom";
import OrdersPage from "./pages/OrdersPage";
import ProductPage from "./pages/ProductPage";
import PosPage from "./pages/PosPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PosPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/products" element={<ProductPage />} />
      <Route path="/pos" element={<PosPage />} />
    </Routes>
  );
}

export default App;
