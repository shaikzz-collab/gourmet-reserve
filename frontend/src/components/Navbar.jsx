import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Calendar, LayoutDashboard, Utensils, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(15, 19, 34, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <Link to="/" style={{
        textDecoration: 'none',
        color: 'white',
        fontSize: '1.4rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        letterSpacing: '-0.025em'
      }}>
        <Utensils style={{ color: '#6366f1' }} size={24} />
        <span>Gourmet<span style={{ color: '#06b6d4' }}>Reserve</span></span>
      </Link>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link 
              to="/dashboard" 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>

            {user.role === 'customer' ? (
              <Link 
                to="/book" 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Calendar size={16} />
                <span>Book Table</span>
              </Link>
            ) : (
              <span style={{ display: 'none' }}></span>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            paddingLeft: '1.5rem'
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>
                {user.name}
              </div>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: user.role === 'admin' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                color: user.role === 'admin' ? '#818cf8' : '#22d3ee',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px',
                border: user.role === 'admin' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                {user.role}
              </span>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.5rem', 
                borderRadius: '50%', 
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.2)'
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
            Sign Up
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
