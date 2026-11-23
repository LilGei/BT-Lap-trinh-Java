import React, { useState, useEffect } from "react";
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
import "@/presentation/styles/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    if (errorMessage) setErrorMessage("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (!loginData.username.trim()) {
      setErrorMessage("Vui lòng nhập tài khoản hoặc Email Quản trị viên!");
      return;
    }
    if (!loginData.password.trim()) {
      setErrorMessage("Vui lòng nhập mật khẩu!");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await authApi.adminLogin(loginData);
      const data = res?.data || res;
      const token = data?.token || data?.accessToken;
      const userObj = data?.user || data;
      const username = userObj?.username || loginData.username;
      const fullName = userObj?.fullName || username;
      const role = (userObj?.role || "").toUpperCase();

      if (!token) {
        throw new Error("Không nhận được token xác thực từ máy chủ.");
      }

      if (role && role !== "OWNER" && role !== "ADMIN") {
        setErrorMessage(
          "Tài khoản này không có quyền Quản trị viên. Vui lòng đăng nhập ở trang User!"
        );
        setLoading(false);
        return;
      }

      login({
        token,
        role: role || "OWNER",
        username,
        fullName,
      });

      navigate("/overview", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Sai tài khoản hoặc mật khẩu Quản trị viên!";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-wrapper">
      <div className="admin-login-wrapper">
        <div className="admin-left-side">
          <div className="admin-header-logo">
            <span className="logo-uth">Project</span>
            <span className="logo-workplace">OISM</span>
          </div>

          <div className="admin-content-container">
            <h2 className="admin-welcome-title">Admin Portal</h2>
            <p className="admin-welcome-subtitle">
              Đăng nhập bằng tài khoản Chủ cửa hàng / Quản trị viên
            </p>

            <form onSubmit={handleAdminLogin}>
              <div className="admin-input-group">
                <label>Admin Username</label>
                <div className="admin-input-wrapper">
                  <FontAwesomeIcon icon={faUser} className="admin-input-icon" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Admin Email/Username"
                    value={loginData.username}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="admin-input-group">
                <label>Password</label>
                <div className="admin-input-wrapper">
                  <FontAwesomeIcon icon={faLock} className="admin-input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {errorMessage && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: "14px",
                    marginBottom: "10px",
                    fontWeight: 500,
                  }}
                >
                  {errorMessage}
                </p>
              )}

              <div className="admin-forgot-pw">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button
                type="submit"
                className="admin-submit-btn"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Login"}
              </button>
            </form>

            <div className="admin-divider">
              <span>Or continue with</span>
            </div>

            <div className="admin-social-login">
              <button className="admin-social-btn admin-google" type="button">
                <FontAwesomeIcon icon={faGoogle} />
              </button>
              <button className="admin-social-btn admin-oauth" type="button">
                <FontAwesomeIcon icon={faShieldAlt} />
              </button>
              <button className="admin-social-btn admin-gmail" type="button">
                <FontAwesomeIcon icon={faEnvelope} />
              </button>
            </div>

            <div className="admin-back-link">
              <Link to="/login">← Back to User Login</Link>
            </div>
          </div>
        </div>

        <div className="admin-right-side">
          <div className="admin-diagonal-bg"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;