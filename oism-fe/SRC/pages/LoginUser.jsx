import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faShieldAlt, faUser, faLock } from '@fortawesome/free-solid-svg-icons'; 
import { useAuth } from '../../AppProvider'; 
import '../styles/LoginUser.css';

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const registeredUsers = JSON.parse(localStorage.getItem("registered_users") || "[]");
      
      const foundUser = registeredUsers.find(
        (u) => (u.username === loginData.username || u.email === loginData.username) && u.password === loginData.password
      );

      if (foundUser || loginData.username !== "") {
        const username = foundUser ? foundUser.username : loginData.username;
        const role = foundUser ? foundUser.role : "candidate";

        localStorage.setItem('access_token', 'mock_token_123456');
        localStorage.setItem('user_role', role); 
        localStorage.setItem('username', username);
        
        if (auth?.setUser) {
          auth.setUser({ username, role });
        }

        alert("Đăng nhập thành công!");
        navigate('/overview');
      } else {
        alert("Tài khoản hoặc mật khẩu không chính xác!");
      }

      setLoading(false);
    }, 400);
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
            <p className="sub-text">Let's get started !!!</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <FontAwesomeIcon icon={faUser} className="input-icon-inner" />
              <input 
                type="text" 
                name="username" 
                placeholder="Username" 
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
              <Link to="/forgot">Forgot password</Link>
            </div>

            <div className="login-action-area">
              <button type="submit" className="login-btn-purple" disabled={loading}>
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