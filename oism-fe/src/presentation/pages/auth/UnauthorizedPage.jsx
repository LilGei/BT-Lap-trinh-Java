import { useNavigate } from "react-router-dom";
import { useAuth } from "@/application/context/AppProvider";

function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = (user?.role || "").toUpperCase();

  const handleGoHome = () => {
    if (role === "CASHIER") {
      navigate("/pos", { replace: true });
    } else {
      navigate("/overview", { replace: true });
    }
  };

  const handleSwitchAccount = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="oism-error-wrapper">
      <div className="oism-error-card">
        <div className="oism-error-badge forbidden">403</div>
        <h1>Không có quyền truy cập</h1>
        <p>
          Tài khoản <strong>{user?.username || "hiện tại"}</strong> (Vai trò:{" "}
          <span className="oism-role-tag">{role || "CHƯA XÁC ĐỊNH"}</span>) không
          được phép truy cập trang này.
        </p>

        <div className="oism-error-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleGoHome}
          >
            Quay về trang làm việc của bạn
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSwitchAccount}
          >
            Đăng nhập tài khoản khác
          </button>
        </div>
      </div>

      <style>{`
        .oism-error-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          padding: 20px;
          font-family: inherit;
        }
        .oism-error-card {
          background: #ffffff;
          max-width: 480px;
          width: 100%;
          padding: 40px 32px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
          text-align: center;
        }
        .oism-error-badge {
          display: inline-block;
          font-size: 42px;
          font-weight: 800;
          padding: 8px 24px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .oism-error-badge.forbidden {
          background: #fef2f2;
          color: #dc2626;
        }
        .oism-error-card h1 {
          margin: 0 0 12px;
          font-size: 22px;
          color: #0f172a;
        }
        .oism-error-card p {
          margin: 0 0 28px;
          color: #475569;
          line-height: 1.6;
          font-size: 14px;
        }
        .oism-role-tag {
          background: #e2e8f0;
          color: #1e293b;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 12px;
        }
        .oism-error-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .oism-error-actions button {
          padding: 11px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: 0.2s;
        }
        .oism-error-actions .btn-primary {
          background: #2563eb;
          color: #ffffff;
        }
        .oism-error-actions .btn-primary:hover {
          background: #1d4ed8;
        }
        .oism-error-actions .btn-secondary {
          background: #f1f5f9;
          color: #334155;
        }
        .oism-error-actions .btn-secondary:hover {
          background: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

export default UnauthorizedPage;