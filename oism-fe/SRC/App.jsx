import { Routes, Route } from "react-router-dom";
import ProductPage from "./pages/ProductPage";
import PosPage from "./pages/PosPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PosPage />} />
      <Route path="/products" element={<ProductPage />} />
      <Route path="/pos" element={<PosPage />} />
    </Routes>
  );
}

export default App;