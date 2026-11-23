import { useState } from "react";
import { authApi } from "@/infrastructure/api/authApi";

function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setError("");
    setSuccess("");
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      setSuccess("Đổi mật khẩu thành công!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Mật khẩu hiện tại không chính xác hoặc không thể đổi mật khẩu!";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oism-popup-overlay" onClick={handleClose}>
      <div className="oism-popup-card" onClick={(e) => e.stopPropagation()}>
        <div className="oism-popup-head">
          <h3>Đổi mật khẩu tài khoản</h3>
          <button type="button" onClick={handleClose} disabled={loading}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="oism-popup-body">
          {error && <div className="popup-alert error">{error}</div>}
          {success && <div className="popup-alert success">{success}</div>}

          <label>
            Mật khẩu hiện tại *
            <input
              type="password"
              required
              disabled={loading}
              value={form.oldPassword}
              onChange={(e) =>
                setForm({ ...form, oldPassword: e.target.value })
              }
              placeholder="Nhập mật khẩu hiện tại"
            />
          </label>

          <label>
            Mật khẩu mới *
            <input
              type="password"
              required
              disabled={loading}
              value={form.newPassword}
              onChange={(e) =>
                setForm({ ...form, newPassword: e.target.value })
              }
              placeholder="Tối thiểu 6 ký tự"
            />
          </label>

          <label>
            Xác nhận mật khẩu mới *
            <input
              type="password"
              required
              disabled={loading}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              placeholder="Nhập lại mật khẩu mới"
            />
          </label>

          <div className="oism-popup-foot">
            <button
              type="button"
              className="btn-ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
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
          background: #fff; width: 100%; max-width: 420px; border-radius: 14px;
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
        .oism-popup-body label {
          display: flex; flex-direction: column; gap: 6px; font-size: 13px;
          font-weight: 600; color: #334155;
        }
        .oism-popup-body input {
          padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
        }
        .popup-alert {
          padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
        }
        .popup-alert.error { background: #fee2e2; color: #b91c1c; }
        .popup-alert.success { background: #dcfce7; color: #15803d; }
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
        .btn-primary:disabled, .btn-ghost:disabled {
          opacity: 0.6; cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default ChangePasswordModal;