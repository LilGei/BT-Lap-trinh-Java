import "../styles/PosHeader.css";

function PosHeader({
  storeName = "OISM Store · Quận 1",
  terminalName = "POS-01",
  cashierName = "Nguyễn Văn An",
  shiftName = "Ca sáng",
}) {
  return (
    <header className="pos-header">
      <div className="pos-header__brand" aria-label="OISM POS">
        <span className="pos-header__brand-mark" aria-hidden="true">
          O
        </span>
        <span className="pos-header__brand-copy">
          <strong>OISM</strong>
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

      <div className="pos-header__tools">
        <div className="pos-header__actions">
          <button className="pos-header__action" type="button">
            <span aria-hidden="true">↩</span>
            Return
          </button>
          <button className="pos-header__action" type="button">
            <span aria-hidden="true">◷</span>
            History
          </button>
        </div>

        <span className="pos-header__session-divider" aria-hidden="true" />

        <div className="pos-header__shift">
          <strong>{shiftName}</strong>
          <span>07:00 – 15:00</span>
        </div>

        <span className="pos-header__session-divider" aria-hidden="true" />

        <div className="pos-header__session">
          <span className="pos-header__online">
            <span className="pos-header__online-dot" />
            Đang hoạt động
          </span>
          <div className="pos-header__cashier">
            <span className="pos-header__avatar" aria-hidden="true">
              {cashierName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="pos-header__cashier-copy">
              <strong>{cashierName}</strong>
              <span>Thu ngân</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default PosHeader;