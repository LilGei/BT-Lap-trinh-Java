import { useNavigate } from "react-router-dom";
import { useAuth } from "@/application/context/AppProvider";

function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || "").toUpperCase();

  const handleBack = () => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (role === "CASHIER") {
      navigate("/pos", { replace: true });
    } else {
      navigate("/overview", { replace: true });
    }
  };

  return (
    <div className="oism-error-wrapper">
      <div className="oism-error-card">
        <div className="oism-error-badge notfound">404</div>
        <h1>Không tìm thấy trang</h1>
        <p>
          Đường dẫn bạn vừa truy cập không tồn tại hoặc đã bị thay đổi trong hệ
          thống OISM.
        </p>
        <div className="oism-error-actions">
          <button type="button" className="btn-primary" onClick={handleBack}>
            Quay về trang chủ
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
        }
        .oism-error-card {
          background: #ffffff;
          max-width: 460px;
          width: 100%;
          padding: 40px 32px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
          text-align: center;
        }
        .oism-error-badge.notfound {
          display: inline-block;
          font-size: 42px;
          font-weight: 800;
          padding: 8px 24px;
          border-radius: 12px;
          margin-bottom: 16px;
          background: #eff6ff;
          color: #2563eb;
        }
        .oism-error-card h1 {
          margin: 0 0 12px;
          font-size: 22px;
          color: #0f172a;
        }
        .oism-error-card p {
          margin: 0 0 28px;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }
        .oism-error-actions .btn-primary {
          width: 100%;
          padding: 11px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          background: #2563eb;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}

export default NotFoundPage;