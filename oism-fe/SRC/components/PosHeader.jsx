import "../styles/pos.css";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="pos-header__search-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.2 4.2" />
    </svg>
  );
}

function PosHeader({
  storeName = "OISM Store · Quận 1",
  terminalName = "POS-01",
  cashierName = "Nguyễn Văn An",
  shiftName = "Ca sáng",
  onSearchChange,
  onSearchSubmit,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      onSearchSubmit?.(event.currentTarget.value.trim());
    }
  };

  return (
    <header className="pos-header">
      <div className="pos-header__brand" aria-label="OISM POS">
        <span className="pos-header__brand-mark" aria-hidden="true">
          O
        </span>
        <span className="pos-header__brand-copy">
          <strong>OISM</strong>
          <span>POINT OF SALE</span>
        </span>
      </div>

      <div className="pos-header__store" aria-label="Thông tin cửa hàng">
        <span className="pos-header__store-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3.5 10 5 4.5h14L20.5 10" />
            <path d="M4.5 10v9.5h15V10M9 19.5v-6h6v6M3.5 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
          </svg>
        </span>
        <span className="pos-header__store-copy">
          <strong>{storeName}</strong>
          <span>{terminalName}</span>
        </span>
      </div>

      <label className="pos-header__search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Tìm tên, SKU hoặc quét mã vạch..."
          aria-label="Tìm sản phẩm theo tên, SKU hoặc mã vạch"
          autoFocus
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className="pos-header__search-hint" aria-hidden="true">
          Enter
        </span>
      </label>

      <div className="pos-header__session">
        <span className="pos-header__online">
          <span className="pos-header__online-dot" />
          Đang hoạt động
        </span>
        <span className="pos-header__session-divider" aria-hidden="true" />
        <div className="pos-header__cashier">
          <span className="pos-header__avatar" aria-hidden="true">
            {cashierName.trim().charAt(0).toUpperCase()}
          </span>
          <span className="pos-header__cashier-copy">
            <strong>{cashierName}</strong>
            <span>{shiftName}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export default PosHeader;