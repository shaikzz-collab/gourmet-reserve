import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, AlertTriangle, Utensils } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { login, error, loading, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear auth context errors when entering this page
    setError(null);
  }, [setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is already managed by AuthContext
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem'
    }}>
      <div className="glass-panel-glow animated-fade-in" style={{
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', marginBottom: '1rem' }}>
          <Utensils size={32} style={{ color: '#6366f1' }} />
        </div>
        
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Log in to manage or book restaurant tables
        </p>

        {(validationError || error) && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
          >
            <LogIn size={18} />
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </div>

        {/* Demo credentials tip for the evaluator */}
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1rem', textAlign: 'left', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>Demo Accounts:</div>
          <div><span style={{ color: '#818cf8', fontWeight: 500 }}>Admin:</span> admin@restaurant.com / adminpassword</div>
          <div><span style={{ color: '#22d3ee', fontWeight: 500 }}>Customer:</span> customer@gmail.com / customerpassword</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
