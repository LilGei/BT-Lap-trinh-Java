import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faShieldAlt, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../AppProvider';
import "../styles/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    if (errorMessage) setErrorMessage('');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();

    if (!loginData.username.trim()) {
      setErrorMessage("Please enter your Admin Username/Email!");
      return;
    }
    if (!loginData.password.trim()) {
      setErrorMessage("Please enter your password!");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
      const foundAdmin = registeredUsers.find(
        (u) =>
          (u.username === loginData.username || u.email === loginData.username) &&
          u.password === loginData.password &&
          u.role === 'admin'
      );

      if (foundAdmin || (loginData.username === 'admin' && loginData.password === '123456')) {
        const username = foundAdmin ? foundAdmin.username : loginData.username;

        localStorage.setItem('access_token', 'mock_admin_token_123456');
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('username', username);

        if (auth?.setUser) {
          auth.setUser({
            role: 'admin',
            username: username
          });
        }

        alert("Admin Login Successful!");
        navigate('/overview');
      } else {
        setErrorMessage("Sai tài khoản hoặc mật khẩu Admin! (Mặc định: admin / 123456)");
      }

      setLoading(false);
    }, 400);
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
            <p className="admin-welcome-subtitle">Enter your admin credentials to access the dashboard</p>

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
                <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
                  {errorMessage}
                </p>
              )}

              <div className="admin-forgot-pw">
                <Link to="/forgot">Forgot password?</Link>
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