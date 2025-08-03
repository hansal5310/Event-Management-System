import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginRegister = ({ setUser, apiBaseUrl = 'http://localhost:5000' }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: 'User',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Password strength calculation
  useEffect(() => {
    if (!isLogin && formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    }
  }, [formData.password, isLogin]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return levels[strength - 1] || 'Very Weak';
  };

  const getPasswordStrengthColor = (strength) => {
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
    return colors[strength - 1] || '#dc3545';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isLogin && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.name) {
        errors.name = 'Name is required';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation errors as user types
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
    
    // Clear general error
    if (error) setError('');
  };

  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setValidationErrors({});
    setFormData({ 
      email: formData.email, // Keep email when switching
      password: '', 
      confirmPassword: '', 
      role: 'User',
      name: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await axios.post(`${apiBaseUrl}/api/login`, {
          email: formData.email.trim(),
          password: formData.password,
        });
        
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        
        // Simulate loading for better UX
        setTimeout(() => {
          if (res.data.user.role === 'Admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/user-events');
          }
        }, 1000);
        
      } else {
        const res = await axios.post(`${apiBaseUrl}/api/register`, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        });
        
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        
        // Simulate loading for better UX
        setTimeout(() => {
          navigate(formData.role === 'Admin' ? '/admin-dashboard' : '/user-events');
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Elements */}
      <div className="auth-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="floating-elements">
          <div className="floating-element element-1">🎫</div>
          <div className="floating-element element-2">🎉</div>
          <div className="floating-element element-3">📅</div>
          <div className="floating-element element-4">🎊</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="auth-content">
        {/* Brand Header */}
        <div className="brand-header">
          <div className="brand-logo">
            <div className="logo-icon">E</div>
            <span className="logo-text">EventHub</span>
          </div>
          <p className="brand-tagline">Create, Manage & Attend Amazing Events</p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          {/* Tab Navigation */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => handleTabSwitch(true)}
              type="button"
            >
              <span className="tab-icon">🔑</span>
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => handleTabSwitch(false)}
              type="button"
            >
              <span className="tab-icon">👤</span>
              Sign Up
            </button>
          </div>

          {/* Form Header */}
          <div className="form-header">
            <h2>
              {isLogin ? 'Welcome Back!' : 'Join EventHub'}
            </h2>
            <p>
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Create your account to get started'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  Full Name
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`form-input ${validationErrors.name ? 'error' : ''}`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
                {validationErrors.name && (
                  <span className="field-error">{validationErrors.name}</span>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">✉️</span>
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  autoComplete="username"
                />
              </div>
              {validationErrors.email && (
                <span className="field-error">{validationErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
              
              {/* Password Strength Indicator (Sign Up Only) */}
              {!isLogin && formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor(passwordStrength)
                      }}
                    ></div>
                  </div>
                  <span 
                    className="strength-text"
                    style={{ color: getPasswordStrengthColor(passwordStrength) }}
                  >
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
              )}
            </div>

            {/* Sign Up Only Fields */}
            {!isLogin && (
              <>
                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🔐</span>
                    Confirm Password
                  </label>
                  <div className="input-wrapper password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <span className="field-error">{validationErrors.confirmPassword}</span>
                  )}
                </div>

                {/* Role Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🎭</span>
                    Account Type
                  </label>
                  <div className="role-selection">
                    <label className={`role-option ${formData.role === 'User' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="User"
                        checked={formData.role === 'User'}
                        onChange={handleChange}
                      />
                      <div className="role-content">
                        <span className="role-icon">👥</span>
                        <div className="role-info">
                          <span className="role-title">Event Attendee</span>
                          <span className="role-desc">Browse and attend events</span>
                        </div>
                      </div>
                    </label>
                    <label className={`role-option ${formData.role === 'Admin' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="role"
                        value="Admin"
                        checked={formData.role === 'Admin'}
                        onChange={handleChange}
                      />
                      <div className="role-content">
                        <span className="role-icon">👑</span>
                        <div className="role-info">
                          <span className="role-title">Event Organizer</span>
                          <span className="role-desc">Create and manage events</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* General Error */}
            {error && (
              <div className="form-error">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`auth-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  <span className="btn-icon">
                    {isLogin ? '🚀' : '✨'}
                  </span>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => handleTabSwitch(false)}
                >
                  Sign up here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  className="link-btn"
                  onClick={() => handleTabSwitch(true)}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Easy Event Discovery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-text">Instant RSVP</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span className="feature-text">Digital Tickets</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔔</span>
              <span className="feature-text">Smart Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;