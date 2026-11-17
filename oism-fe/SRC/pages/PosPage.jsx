import ProductArea from "../components/pos/ProductArea";
import CartArea from "../components/pos/CartArea";
import "../styles/PosPage.css";

function PosPage() {
  return (
    <div className="pos-page">
      <ProductArea />
      <CartArea />
    </div>
  );
}

export default PosPage;
