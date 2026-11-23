import { useState } from "react";

function StoreInfoModal({ isOpen, onClose }) {
  const [storeInfo, setStoreInfo] = useState({
    storeName: "OISM Retail & Omnichannel",
    taxCode: "0312345678",
    hotline: "1900 6868",
    email: "contact@oism.vn",
    address: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
    vatRate: "8",
  });
  const [savedMessage, setSavedMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO Bước 2: Gọi API cập nhật thông tin cửa hàng
    setSavedMessage("Đã lưu thông tin cửa hàng thành công!");
    setTimeout(() => {
      setSavedMessage("");
      onClose();
    }, 1000);
  };

  return (
    <div className="oism-popup-overlay" onClick={onClose}>
      <div className="oism-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="oism-popup-head">
          <h3>Thông tin cửa hàng</h3>
          <button type="button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="oism-popup-body">
          {savedMessage && <div className="popup-alert success">{savedMessage}</div>}

          <label>
            Tên hệ thống / Cửa hàng
            <input
              type="text"
              required
              value={storeInfo.storeName}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, storeName: e.target.value })
              }
            />
          </label>

          <div className="popup-row">
            <label>
              Mã số thuế
              <input
                type="text"
                value={storeInfo.taxCode}
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, taxCode: e.target.value })
                }
              />
            </label>
            <label>
              Hotline
              <input
                type="text"
                value={storeInfo.hotline}
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, hotline: e.target.value })
                }
              />
            </label>
          </div>

          <div className="popup-row">
            <label>
              Email liên hệ
              <input
                type="email"
                value={storeInfo.email}
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, email: e.target.value })
                }
              />
            </label>
            <label>
              Thuế VAT mặc định (%)
              <input
                type="number"
                min="0"
                max="100"
                value={storeInfo.vatRate}
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, vatRate: e.target.value })
                }
              />
            </label>
          </div>

          <label>
            Địa chỉ trụ sở chính
            <input
              type="text"
              value={storeInfo.address}
              onChange={(e) =>
                setStoreInfo({ ...storeInfo, address: e.target.value })
              }
            />
          </label>

          <div className="oism-popup-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Đóng
            </button>
            <button type="submit" className="btn-primary">
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .oism-popup-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
          display: flex; align-items: center; justify-content: center; z-index: 1100;
          padding: 16px;
        }
        .oism-popup-card {
          background: #fff; width: 100%; max-width: 480px; border-radius: 14px;
          box-shadow: 0 20px 35px rgba(0, 0, 0, 0.25); overflow: hidden;
        }
        .oism-popup-head {
          padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
        }
        .oism-popup-head h3 { margin: 0; font-size: 17px; color: #0f172a; }
        .oism-popup-head button {
          background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b;
        }
        .oism-popup-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .popup-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .oism-popup-body label {
          display: flex; flex-direction: column; gap: 6px; font-size: 13px;
          font-weight: 600; color: #334155;
        }
        .oism-popup-body input {
          padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
        }
        .popup-alert.success {
          background: #dcfce7; color: #15803d; padding: 10px 12px;
          border-radius: 8px; font-size: 13px; font-weight: 600;
        }
        .oism-popup-foot {
          display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;
        }
        .btn-ghost {
          padding: 9px 16px; border-radius: 8px; border: 1px solid #cbd5e1;
          background: #fff; cursor: pointer; font-weight: 600;
        }
        .btn-primary {
          padding: 9px 18px; border-radius: 8px; border: none;
          background: #2563eb; color: #fff; cursor: pointer; font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default StoreInfoModal;