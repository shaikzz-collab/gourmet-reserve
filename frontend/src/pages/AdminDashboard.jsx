import React, { useState, useEffect } from 'react';
import { reservationAPI, tableAPI } from '../services/api';
import { Calendar, User, Clock, Users, XCircle, CheckCircle, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  // Date filter for reservations
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // Data states
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  
  // Table Form states
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(2);
  
  // Loading and Error states
  const [loadingRes, setLoadingRes] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [errorRes, setErrorRes] = useState(null);
  const [errorTable, setErrorTable] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchReservations = async () => {
    setLoadingRes(true);
    setErrorRes(null);
    try {
      // Pass date filter if selected
      const filters = {};
      if (filterDate) filters.date = filterDate;
      const data = await reservationAPI.getAll(filters);
      setReservations(data);
    } catch (err) {
      setErrorRes(err.message || 'Failed to retrieve reservations.');
    } finally {
      setLoadingRes(false);
    }
  };

  const fetchTables = async () => {
    setLoadingTables(true);
    setErrorTable(null);
    try {
      const data = await tableAPI.getAll();
      setTables(data);
    } catch (err) {
      setErrorTable(err.message || 'Failed to retrieve tables.');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filterDate]);

  useEffect(() => {
    fetchTables();
  }, []);

  // Update reservation status (Cancel or Confirm)
  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to update this reservation to ${status}?`)) {
      return;
    }
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await reservationAPI.update(id, { status });
      await fetchReservations();
    } catch (err) {
      alert(err.message || 'Failed to update reservation status');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Create new table
  const handleAddTable = async (e) => {
    e.preventDefault();
    setErrorTable(null);

    if (!newTableNumber || newTableCapacity <= 0) {
      setErrorTable('Please enter valid table details.');
      return;
    }

    try {
      await tableAPI.create({
        tableNumber: newTableNumber,
        capacity: newTableCapacity
      });
      setNewTableNumber('');
      setNewTableCapacity(2);
      await fetchTables();
    } catch (err) {
      setErrorTable(err.message || 'Failed to create table.');
    }
  };

  // Delete a table
  const handleDeleteTable = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table? This will fail if there are active bookings.')) {
      return;
    }
    
    setErrorTable(null);
    try {
      await tableAPI.delete(id);
      await fetchTables();
    } catch (err) {
      setErrorTable(err.message || 'Failed to delete table.');
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === 'confirmed') {
      return { background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)' };
    } else {
      return { background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)' };
    }
  };

  return (
    <div className="animated-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Administrative Control Panel
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Monitor restaurant bookings, filter reservations by date, and manage tables.
        </p>
      </div>

      <div className="grid-container">
        {/* Left Side: Tables Management */}
        <div className="col-sidebar">
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Add Table</span>
            </h3>

            {errorTable && (
              <div className="alert alert-error" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{errorTable}</span>
              </div>
            )}

            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label htmlFor="tbl-num">Table Name/Number</label>
                <input
                  id="tbl-num"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Table 9"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tbl-cap">Seating Capacity</label>
                <input
                  id="tbl-cap"
                  type="number"
                  className="form-control"
                  min="1"
                  max="20"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 2)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                <Plus size={16} />
                <span>Create Table</span>
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Restaurant Tables</h3>
              <button onClick={fetchTables} className="btn btn-secondary" style={{ padding: '0.4rem' }}>
                <RefreshCw size={14} className={loadingTables ? 'spin-animation' : ''} />
              </button>
            </div>

            {loadingTables ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-muted)' }}>Loading...</div>
            ) : tables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-muted)' }}>No tables registered.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {tables.map(table => (
                  <div 
                    key={table._id}
                    className="glass-panel"
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{table.tableNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Capacity: {table.capacity} guests</div>
                    </div>
                    <button
                      onClick={() => handleDeleteTable(table._id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      title="Delete Table"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Reservations Manager */}
        <div className="col-content">
          <div className="glass-panel" style={{ padding: '1.75rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>All Reservations</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                  Active and cancelled bookings across the establishment
                </p>
              </div>

              {/* Date Filter Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: 'var(--color-muted)' }} />
                <input
                  type="date"
                  className="form-control"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', width: '150px' }}
                />
                {filterDate && (
                  <button 
                    onClick={() => setFilterDate('')} 
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    Clear Filter
                  </button>
                )}
                <button onClick={fetchReservations} className="btn btn-secondary" style={{ padding: '0.45rem' }}>
                  <RefreshCw size={14} className={loadingRes ? 'spin-animation' : ''} />
                </button>
              </div>
            </div>

            {errorRes && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{errorRes}</span>
              </div>
            )}

            {loadingRes ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px' }}>
                <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '35px', height: '35px', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--color-muted)', flex: 1 }}>
                <Calendar size={36} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                <h4>No Reservations Found</h4>
                <p style={{ fontSize: '0.9rem' }}>
                  {filterDate ? `There are no bookings scheduled for ${filterDate}.` : 'There are no registered reservations in the system.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {reservations.map((res) => {
                  const resDate = new Date(res.date);
                  const formattedDate = resDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={res._id}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#f8fafc' }}>
                              {res.user ? res.user.name : 'Unknown User'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                              ({res.user ? res.user.email : 'No email'})
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--color-text-dark)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={13} style={{ color: 'var(--color-muted)' }} />
                              {formattedDate}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={13} style={{ color: 'var(--color-muted)' }} />
                              {res.timeSlot}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Users size={13} style={{ color: 'var(--color-muted)' }} />
                              Guests: {res.guestsCount}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            ...getStatusBadgeStyle(res.status)
                          }}>
                            {res.status}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-accent)' }}>
                            {res.table ? res.table.tableNumber : 'Table Removed'}
                          </span>
                        </div>
                      </div>

                      {/* Action controllers */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '0.75rem' }}>
                        {res.status === 'confirmed' ? (
                          <button
                            onClick={() => handleUpdateStatus(res._id, 'cancelled')}
                            className="btn btn-secondary"
                            disabled={actionLoading[res._id]}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            Cancel Reservation
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(res._id, 'confirmed')}
                            className="btn btn-secondary"
                            disabled={actionLoading[res._id]}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
                          >
                            Re-Confirm Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
