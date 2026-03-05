import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const retryFetch = async (url, options, maxRetries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await retryFetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data based on Remember Me option
        if (rememberMe) {
          localStorage.setItem('psa_token', data.token);
          localStorage.setItem('psa_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('psa_token', data.token);
          sessionStorage.setItem('psa_user', JSON.stringify(data.user));
        }

        // Audit logging - Successful login
        console.log(`[AUDIT] Successful login for user: ${email}, Role: ${data.user.role}`);

        // Redirect to dashboard
        onLogin(data.user.email, data.user.role);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
        console.log(`[AUDIT] Failed login attempt for user: ${email}`);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('[AUDIT] Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-section">
          <div className="login-icon"></div>
          <h1>PSA System</h1>
          <p>Philippine Statistics Authority</p>
        </div>

        <form className="login-form-section" onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              <span className="error-icon"></span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">
              <span className="input-icon"></span> Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <span className="input-icon"></span> Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? '' : ''}
              </button>
            </div>
          </div>

          <div className="options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="checkbox-custom"></span>
              Remember Me
            </label>
            <a href="#" className="link-text">Forgot Password?</a>
          </div>

          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
          <div className="forAccount">
            <span >Don't have an account? <a href="/signup" className="forReg">Sign Up</a></span>
          </div>
        </form>

        <div className="login-footer-section">
          <p> Secure Login | Session auto-locks after 30 minutes of inactivity</p>
          <p className="copyright">© 2024 Philippine Statistics Authority</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
