import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/ForgotPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    newPassword: '',
    repeatPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { email, phone, newPassword, repeatPassword } = formData;

    if (!email.trim() || !phone.trim() || !newPassword.trim() || !repeatPassword.trim()) {
      alert("Please fill in all fields!");
      return;
    }

    if (newPassword !== repeatPassword) {
      alert("Passwords do not match!");
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const userIndex = savedUsers.findIndex(u => u.email === email && u.phone === phone);

    if (userIndex === -1) {
      alert("Account not found or information is incorrect!");
      return;
    }

    savedUsers[userIndex].password = newPassword;
    localStorage.setItem('registered_users', JSON.stringify(savedUsers));
    alert("Password updated successfully!");
    navigate('/login');
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h1>FORGOT PASSWORD</h1>
        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-group">
            <label>Enter your email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com" />
          </div>
          <div className="forgot-group">
            <label>Phone number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="forgot-group">
            <label>New password</label>
            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} />
          </div>
          <div className="forgot-group">
            <label>Repeat password</label>
            <input type="password" name="repeatPassword" value={formData.repeatPassword} onChange={handleChange} />
          </div>
          <div className="forgot-btn-container">
            <button type="submit" className="forgot-btn">Change</button>
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