import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faShieldAlt,
  faUser,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/application/context/AppProvider";
import { authApi } from "@/infrastructure/api/authApi";
import "@/presentation/styles/LoginUser.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.username.trim() || !loginData.password.trim()) {
      alert("Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
      return;
    }

    setLoading(true);
    try {
      // Gọi API đăng nhập thật từ Spring Boot Backend
      const res = await authApi.login(loginData);

      // Hỗ trợ linh hoạt cấu trúc response từ Backend (res.token hoặc res.data.token)
      const data = res?.data || res;
      const token = data?.token || data?.accessToken;
      const userObj = data?.user || data;
      const username = userObj?.username || loginData.username;
      const fullName = userObj?.fullName || username;
      const role = (userObj?.role || "OWNER").toUpperCase();

      if (!token) {
        throw new Error("Không nhận được token xác thực từ máy chủ.");
      }

      // Lưu đồng bộ vào tokenStorage và AppProvider state
      login({ token, role, username, fullName });

      // Điều hướng đúng trang làm việc theo phân quyền RBAC
      if (role === "CASHIER") {
        navigate("/pos", { replace: true });
      } else {
        navigate("/overview", { replace: true });
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Tài khoản hoặc mật khẩu không chính xác!";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left">
        <div className="logo-section">
          <h2 className="uth-text">Project</h2>
          <h2 className="workplace-text">OISM</h2>
        </div>

        <Link to="/admin-login" className="admin-login-link">
          for ADMIN
        </Link>

        <div className="login-content-box">
          <div className="login-header">
            <h2 className="welcome-text">LOGIN</h2>
            <p className="sub-text">Hệ thống Quản lý Kho & Bán hàng Đa kênh</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <FontAwesomeIcon icon={faUser} className="input-icon-inner" />
              <input
                type="text"
                name="username"
                placeholder="Username hoặc Email"
                value={loginData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <FontAwesomeIcon icon={faLock} className="input-icon-inner" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forgot-link-container">
              <Link to="/forgot-password">Forgot password</Link>
            </div>

            <div className="login-action-area">
              <button
                type="submit"
                className="login-btn-purple"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <div className="reg-hint">
                Not a member ? <Link to="/register">Register now</Link>
              </div>
            </div>
          </form>

          <div className="social-section-wrapper">
            <div className="social-divider">
              <span>Or continue with</span>
            </div>

            <div className="social-icons-row">
              <button type="button" className="s-circle s-red">
                <FontAwesomeIcon icon={faGoogle} />
              </button>
              <button type="button" className="s-circle s-black">
                <FontAwesomeIcon icon={faShieldAlt} />
              </button>
              <button type="button" className="s-circle s-gmail">
                <FontAwesomeIcon icon={faEnvelope} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right-side"></div>
    </div>
  );
};

export default Login;