
import { useState } from "react";
import "../styles/pages/LoginPage.css";

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }

    setError("");
    onLogin();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">O</div>
          <h1>OISM</h1>
          <p>INVENTORY MANAGEMENT SYSTEM</p>
        </div>

        <div className="login-heading">
          <h2>Chào mừng trở lại!</h2>
          <p>Đăng nhập để tiếp tục sử dụng hệ thống.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Tài khoản</label>
            <input
              type="text"
              placeholder="Nhập tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="login-form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit">
            Đăng nhập
          </button>
        </form>

        <div className="login-footer">
          OISM - Omnichannel Inventory & Sales Management System
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
