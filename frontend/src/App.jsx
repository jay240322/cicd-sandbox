import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

// Read API URL from environment variables, fallback to localhost:5000
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [user, setUser] = useState(null);

  // Check for cached user session on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('auth_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // Handle successful login/registration
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      {user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          apiUrl={API_URL} 
        />
      ) : (
        <AuthForm 
          onAuthSuccess={handleAuthSuccess} 
          apiUrl={API_URL} 
        />
      )}
    </main>
  );
}
