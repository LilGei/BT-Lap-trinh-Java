import { useEffect, useState } from "react";
import "../../styles/ShopSettingsModal.css";

function ShopSettingsModal({ shopInfo, onSave, onClose }) {
  const [form, setForm] = useState(shopInfo);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setSaveError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextForm = {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };

    if (!nextForm.name) {
      setSaveError("Vui lòng nhập tên cửa hàng.");
      return;
    }

    if (!onSave(nextForm)) {
      setSaveError("Không thể lưu cài đặt. Vui lòng thử lại.");
      return;
    }

    onClose();
  };

  return (
    <div
      className="pos-settings-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="pos-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-settings-title"
      >
        <header className="pos-settings-header">
          <div>
            <h2 id="pos-settings-title">Cài đặt cửa hàng</h2>
            <p>Thông tin này sẽ hiển thị trên hóa đơn.</p>
          </div>
          <button
            type="button"
            className="pos-settings-close"
            onClick={onClose}
            aria-label="Đóng cài đặt"
          >
            ×
          </button>
        </header>

        <form className="pos-settings-form" onSubmit={handleSubmit}>
          <label>
            Tên cửa hàng
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Tên cửa hàng"
              autoComplete="organization"
              autoFocus
              required
            />
          </label>
          <label>
            Địa chỉ
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Địa chỉ cửa hàng"
              autoComplete="street-address"
            />
          </label>
          <div className="pos-settings-contact-fields">
            <label>
              Số điện thoại
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                autoComplete="tel"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                autoComplete="email"
              />
            </label>
          </div>
          {saveError && (
            <p className="pos-settings-error" role="alert">
              {saveError}
            </p>
          )}
          <footer className="pos-settings-actions">
            <button
              type="button"
              className="pos-settings-cancel"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="pos-settings-save">
              Lưu thông tin
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ShopSettingsModal;
