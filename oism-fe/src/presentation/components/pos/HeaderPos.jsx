import { useState } from "react";
import ShopSettingsModal from "./ShopSettingsModal";
import "@/presentation/styles/HeaderPos.css";

function HeaderPos({
  onClearCart,
  onHistory,
  historyOpen,
  cartIsEmpty,
  shopInfo,
  onShopInfoSave,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="pos-app-header">
        <div className="pos-app-heading">
          <span className="pos-app-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 5.5h16v13H4zM8 9h8M8 12h5M8 15h3" />
            </svg>
          </span>
          <div>
            <h1>Hệ thống POS</h1>
            <p>Bán hàng tại quầy</p>
          </div>
        </div>

        <div className="pos-app-actions">
          <button
            type="button"
            className="pos-header-button pos-settings-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Cài đặt cửa hàng"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            title="Cài đặt cửa hàng"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
            </svg>
            <span>Cài đặt</span>
          </button>
          <button
            type="button"
            className="pos-header-button pos-clear-cart-button"
            onClick={onClearCart}
            disabled={cartIsEmpty}
            aria-label="Xóa giỏ hàng"
            title="Xóa giỏ hàng"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
            <span>Xóa giỏ hàng</span>
          </button>
          <button
            type="button"
            className="pos-header-button pos-history-button"
            onClick={onHistory}
            aria-label={
              historyOpen
                ? "Quay lại bán hàng tại quầy"
                : "Lịch sử bán hàng tại quầy"
            }
            title={
              historyOpen
                ? "Quay lại bán hàng tại quầy"
                : "Lịch sử bán hàng tại quầy"
            }
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {historyOpen ? (
                <path d="m14.5 5-7 7 7 7M8 12h12" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </>
              )}
            </svg>
            <span>{historyOpen ? "Quay lại bán hàng" : "Lịch sử POS"}</span>
          </button>
        </div>
      </header>
      {settingsOpen && (
        <ShopSettingsModal
          shopInfo={shopInfo}
          onSave={onShopInfoSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}

export default HeaderPos;