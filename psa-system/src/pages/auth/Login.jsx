import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = (props) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('1. Attempting login with:', { email });

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('2. Response status:', response.status);
      const data = await response.json();
      console.log('3. Response data:', data);

      if (response.ok) {
        // ✅ Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Handle remember me - if checked, we could set longer expiration
        if (rememberMe) {
          // You could implement longer session here
          console.log('Remember me checked - session will be longer');
        }

        console.log('4. ✅ Login successful, data saved to localStorage');
        console.log('   - Token saved:', !!data.token);
        console.log('   - User saved:', data.user);


        if (props.onLogin) {
          props.onLogin(data.user, data.token);
        }

        // ✅ Small delay to ensure storage is updated
        setTimeout(() => {
          console.log('5. Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.log('4. ❌ Login failed:', data.message);
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header-section">
          <h1>PSA System</h1>
          <p>Philippine Statistics Authority</p>
        </div>

        <form className="login-form-section" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              Remember me
            </label>
            <Link to="/forgot-password" className="link-text">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="login-btn submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <div className="forAccount">
            Don't have an account? <Link to="/signup" className="forReg">Sign up</Link>
          </div>
        </form>

        <div className="login-footer-section">
          <p>Secure Login | PSA Internal System</p>
          <p className="copyright">© 2024 Philippine Statistics Authority</p>
        </div>
      </div>
    </div>
  );
};

export default Login;