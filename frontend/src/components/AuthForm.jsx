import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthForm({ onAuthSuccess, apiUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    if (!email || !password) {
      setError('All fields are required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (!isLogin && !username) {
      setError('Please enter a username.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    const payload = isLogin ? { email, password } : { name: username, email, password };
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      // Connect to Mongo-backed Server API
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your credentials.');
      }

      if (isLogin) {
        setSuccess('Welcome back! Login successful.');
        setTimeout(() => {
          onAuthSuccess({
            email: data.user.email,
            username: data.user.name,
            token: data.user.id || 'session-token'
          });
        }, 1000);
      } else {
        setSuccess('Registration successful! You can now log in.');
        setTimeout(() => {
          setIsLogin(true);
          setError('');
          setSuccess('');
          setPassword('');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to establish connection to the server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  return (
    <div className="glass-card">
      <h1 className="display-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
      <p className="subtitle">
        {isLogin 
          ? 'Enter your credentials to access your secure panel' 
          : 'Fill in details below to sign up for a new account'}
      </p>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={18} className="alert-icon" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="input-container">
              <span className="input-icon">
                <User size={18} />
              </span>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="e.g. John Doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <div className="input-container">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-container">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="form-input form-input-with-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button 
          id="auth-submit-btn" 
          type="submit" 
          className="btn-primary" 
          disabled={loading}
        >
          {loading ? (
            <svg className="spinner" viewBox="0 0 50 50">
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
          ) : isLogin ? (
            <>
              <LogIn size={18} />
              <span>Log In</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Sign Up</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-switch">
        <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
        <button 
          id="auth-toggle-mode-btn"
          className="auth-switch-link" 
          onClick={toggleAuthMode}
          disabled={loading}
        >
          {isLogin ? 'Sign Up' : 'Log In'}
        </button>
      </div>
    </div>
  );
}
