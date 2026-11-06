import "../styles/PosProductSearch.css";

function PosProductSearch({ value, onChange }) {
  return (
    <label className="pos-product-search">
      <svg
        aria-hidden="true"
        className="pos-product-search__icon"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search products by name, SKU or scan barcode..."
        aria-label="Search products by name, SKU or scan barcode"
      />
      <svg
        aria-hidden="true"
        className="pos-product-search__barcode"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path d="M4 5v14M7 5v14M10 5v14M13 5v14M16 5v14M20 5v14" />
        <path d="M2.5 8V5h3M18.5 5h3v3M2.5 16v3h3M18.5 19h3v-3" />
      </svg>
    </label>
  );
}

export default PosProductSearch;