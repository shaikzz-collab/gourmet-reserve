import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Clock, Users, XCircle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState({});

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservationAPI.getAll();
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setCancelLoading(prev => ({ ...prev, [id]: true }));
    try {
      await reservationAPI.cancel(id);
      // Refresh reservations lists
      await fetchReservations();
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === 'confirmed') {
      return {
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      };
    } else {
      return {
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.25)',
      };
    }
  };

  return (
    <div className="animated-fade-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Hello, {user.name}
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
            Manage your restaurant table reservations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchReservations} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem' }}>
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          </button>
          <Link to="/book" className="btn btn-primary">
            <Calendar size={16} />
            <span>Book a Table</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : reservations.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <Calendar size={48} style={{ color: 'var(--color-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Reservations Found</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            You don't have any bookings registered. Ready to dine with us?
          </p>
          <Link to="/book" className="btn btn-primary">
            Book Table Now
          </Link>
        </div>
      ) : (
        <div className="grid-container">
          <div className="col-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {reservations.map((res) => {
              const resDate = new Date(res.date);
              const formattedDate = resDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              const isUpcoming = new Date(`${res.date}T23:59:59`) >= new Date();
              const canCancel = res.status === 'confirmed' && isUpcoming;

              return (
                <div 
                  key={res._id} 
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Glass tint based on status */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '6px',
                    height: '100%',
                    background: res.status === 'confirmed' ? 'var(--color-success)' : 'var(--color-error)'
                  }} />

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>{res.table ? res.table.tableNumber : 'Table Removed'}</span>
                      </div>
                      
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        ...getStatusBadgeStyle(res.status)
                      }}>
                        {res.status === 'confirmed' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{res.status}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dark)', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={15} style={{ color: 'var(--color-muted)' }} />
                        <span>{formattedDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={15} style={{ color: 'var(--color-muted)' }} />
                        <span>Slot: {res.timeSlot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={15} style={{ color: 'var(--color-muted)' }} />
                        <span>Guests: {res.guestsCount} {res.table && `(Table Capacity: ${res.table.capacity})`}</span>
                      </div>
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(res._id)}
                      className="btn btn-secondary"
                      disabled={cancelLoading[res._id]}
                      style={{
                        width: '100%',
                        color: 'var(--color-error)',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.02)'
                      }}
                    >
                      <XCircle size={16} />
                      <span>{cancelLoading[res._id] ? 'Cancelling...' : 'Cancel Reservation'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Basic rotating loader utility */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;
