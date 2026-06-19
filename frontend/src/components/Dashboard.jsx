import React, { useState, useEffect } from 'react';
import { LogOut, User, Mail, Shield, CheckCircle, Database } from 'lucide-react';

export default function Dashboard({ user, onLogout, apiUrl }) {
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState({ checking: true, connected: false, name: '' });

  useEffect(() => {
    const checkDbHealth = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setDbStatus({
            checking: false,
            connected: data.databaseConnected,
            name: data.databaseName || 'feedback_db'
          });
        } else {
          setDbStatus({ checking: false, connected: false, name: '' });
        }
      } catch (err) {
        console.error('Failed to retrieve DB health:', err);
        setDbStatus({ checking: false, connected: false, name: '' });
      }
    };

    checkDbHealth();
    // Poll health status every 10 seconds while on the dashboard
    const interval = setInterval(checkDbHealth, 10000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Server logout
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
      onLogout(); // Always clear session state in the client
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="glass-card">
      <div className="dashboard-container">
        <div className="user-avatar">
          {getInitials(user.username || user.email)}
        </div>

        <h1 className="display-title">Dashboard</h1>
        <p className="subtitle">Welcome back to your dashboard panel!</p>

        <div className="alert alert-success">
          <CheckCircle size={18} className="alert-icon" />
          <span>Session securely authenticated.</span>
        </div>

        <div className="dashboard-card">
          {user.username && (
            <div className="dashboard-field">
              <div className="dashboard-label">Username</div>
              <div className="dashboard-value">{user.username}</div>
            </div>
          )}

          <div className="dashboard-field">
            <div className="dashboard-label">Email Address</div>
            <div className="dashboard-value">{user.email}</div>
          </div>

          <div className="dashboard-field">
            <div className="dashboard-label">Session Token</div>
            <div className="dashboard-value" style={{ fontSize: '0.8rem', fontFamily: 'monospace', opacity: 0.7 }}>
              {user.token ? `${user.token.substring(0, 20)}...` : 'N/A'}
            </div>
          </div>

          <div className="dashboard-field" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="dashboard-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={12} />
              <span>MongoDB Status</span>
            </div>
            <div className="dashboard-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
              {dbStatus.checking ? (
                <>
                  <span className="status-dot warning" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--warning)', boxShadow: '0 0 8px var(--warning)', animation: 'pulse 1.5s infinite ease-in-out' }}></span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Checking Database...</span>
                </>
              ) : dbStatus.connected ? (
                <>
                  <span className="status-dot healthy" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: '600' }}>Healthy ({dbStatus.name})</span>
                </>
              ) : (
                <>
                  <span className="status-dot unhealthy" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--error)', boxShadow: '0 0 8px var(--error)' }}></span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--error)', fontWeight: '600' }}>Unhealthy (Disconnected)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button 
          id="logout-btn" 
          onClick={handleLogout} 
          className="btn-danger"
          disabled={loading}
        >
          {loading ? (
            <svg className="spinner" viewBox="0 0 50 50">
              <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
          ) : (
            <>
              <LogOut size={18} />
              <span>Sign Out</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
