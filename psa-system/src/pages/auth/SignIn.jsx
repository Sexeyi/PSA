import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    role: 'Employee',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departments = [
    'Finance and Admin Unit',
    'Statistical Unit',
    'Civil Registration Unit',
    'National ID unit',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.employeeId.trim()) {
      setError('Please enter your employee ID');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!formData.department) {
      setError('Please select a department');
      return false;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Log what we're sending
      const requestBody = {
        fullName: formData.fullName,
        employeeId: formData.employeeId,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        password: formData.password
      };

      console.log('Sending to server:', requestBody);
      console.log('URL:', 'http://localhost:5000/api/auth/register');

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });


      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      // Try to get response as text first
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Then parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText, e);
        throw new Error('Server returned invalid JSON');
      }

      if (response.ok) {
        console.log('Success:', data);
        alert('Account created successfully!');
        navigate('/login');
      } else {
        console.log('Error response:', data);
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Fetch error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`Connection error: ${error.message}. Make sure backend is running on port 5000.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-header-section">
          <h1>PSA System</h1>
          <p>Philippine Statistics Authority</p>
        </div>

        <form className="signup-form-section" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="fullName">
              <span className="input-icon"></span> Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="employeeId">
              <span className="input-icon"></span> Employee ID
            </label>
            <input
              type="text"
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="Enter your employee ID"
              disabled={isLoading}
              autoComplete="off"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">
              <span className="input-icon"></span> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="department">
              <span className="input-icon"></span> Department
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              disabled={isLoading}
              required
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <span className="input-icon"></span> Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Create a password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              <span className="input-icon"></span> Confirm Password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Confirm your password"
                disabled={isLoading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="signup-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <span className="btn-icon"></span>
                Sign Up
              </>
            )}
          </button>

          <div className="login-link">
            <span>Already have an account? <Link to="/login" className="forLogin">Log In</Link></span>
          </div>
        </form>

        <div className="signup-footer-section">
          <p> Secure Registration | All fields are required</p>
          <p className="copyright">© 2024 Philippine Statistics Authority</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
