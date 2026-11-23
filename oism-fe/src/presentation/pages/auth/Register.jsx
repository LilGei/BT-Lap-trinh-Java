import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/infrastructure/api/authApi";
import "@/presentation/styles/Register.css";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    phone: "",
    storeName: "",
    role: "OWNER",
    password: "",
    repeatPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (formData.password !== formData.repeatPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        storeName: formData.storeName.trim(),
        role: formData.role,
        password: formData.password,
      });

      alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Đăng ký thất bại. Username hoặc Email có thể đã tồn tại!";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>REGISTER OISM</h1>
        <form onSubmit={handleRegister}>
          <div className="form-grid">
            <div className="form-group">
              <label>Username *</label>
              <input
                name="username"
                placeholder="VD: owner_q1"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                placeholder="example@oism.vn"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Họ và tên *</label>
              <input
                name="fullName"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại *</label>
              <input
                name="phone"
                placeholder="090xxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Tên cửa hàng / Chi nhánh</label>
              <input
                name="storeName"
                placeholder="OISM Retail Quận 1"
                value={formData.storeName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Vai trò tài khoản (Role)</label>
              <select
                name="role"
                className="form-select"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="OWNER">Chủ cửa hàng (OWNER)</option>
                <option value="STAFF">Nhân viên Kho (STAFF)</option>
                <option value="CASHIER">Thu ngân POS (CASHIER)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Repeat Password *</label>
              <input
                type="password"
                name="repeatPassword"
                placeholder="Nhập lại mật khẩu"
                value={formData.repeatPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-register" disabled={loading}>
            {loading ? "Processing..." : "Register"}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="login-link">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;