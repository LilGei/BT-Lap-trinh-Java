import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/infrastructure/api/authApi";
import "@/presentation/styles/ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    newPassword: "",
    repeatPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, phone, newPassword, repeatPassword } = formData;

    if (
      !email.trim() ||
      !phone.trim() ||
      !newPassword.trim() ||
      !repeatPassword.trim()
    ) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    if (newPassword !== repeatPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({
        email: email.trim(),
        phone: phone.trim(),
        newPassword,
      });

      alert("Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.");
      navigate("/login");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tìm thấy tài khoản hoặc thông tin xác thực không khớp!";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h1>FORGOT PASSWORD</h1>
        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-group">
            <label>Enter your email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
            />
          </div>
          <div className="forgot-group">
            <label>Phone number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="090xxxxxxx"
              required
            />
          </div>
          <div className="forgot-group">
            <label>New password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự"
              required
            />
          </div>
          <div className="forgot-group">
            <label>Repeat password</label>
            <input
              type="password"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>
          <div className="forgot-btn-container">
            <button type="submit" className="forgot-btn" disabled={loading}>
              {loading ? "Updating..." : "Change"}
            </button>
          </div>
        </form>
        <div className="forgot-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;