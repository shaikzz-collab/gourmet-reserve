import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tableAPI, reservationAPI } from '../services/api';
import { Calendar, Clock, Users, Check, AlertCircle, Sparkles, ChevronLeft } from 'lucide-react';

const BookReservation = () => {
  const navigate = useNavigate();
  
  // Form inputs
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('18:00-20:00');
  const [guestsCount, setGuestsCount] = useState(2);
  
  // Data lists
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  
  // Loaders and errors
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch tables and reservations for selected date & slot
  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    setSelectedTable(null); // Clear selected table when parameters change
    try {
      // 1. Get all tables
      const allTables = await tableAPI.getAll();
      setTables(allTables);
      
      // 2. Get reservations for this date
      const activeReservations = await reservationAPI.getAll({ date });
      // Filter reservations for the active timeslot and status = 'confirmed'
      const slotBookings = activeReservations.filter(
        r => r.timeSlot === timeSlot && r.status === 'confirmed'
      );
      setReservations(slotBookings);
    } catch (err) {
      setError(err.message || 'Failed to fetch table availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date && timeSlot) {
      fetchAvailability();
    }
  }, [date, timeSlot]);

  // Form submission
  const handleBooking = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTable) {
      setError('Please select an available table from the layout.');
      return;
    }

    setBookingLoading(true);
    try {
      await reservationAPI.create({
        table: selectedTable._id,
        date,
        timeSlot,
        guestsCount
      });
      setSuccess('Table reserved successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Helper to determine table availability status
  const getTableStatus = (table) => {
    if (!table.isActive) return 'out-of-service';
    
    // Check if booked in the current slot
    const isBooked = reservations.some(
      r => r.table && r.table._id === table._id
    );
    if (isBooked) return 'booked';

    // Check capacity
    if (table.capacity < guestsCount) return 'too-small';

    return 'available';
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="animated-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          <ChevronLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles style={{ color: 'var(--color-primary)' }} />
          <span>Book a Dining Table</span>
        </h1>
        <p style={{ color: 'var(--color-muted)' }}>
          Choose your preferred slot and select an available table from the visual floor map.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid-container">
        {/* Left Side: Parameters Form */}
        <div className="col-sidebar">
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              Booking Details
            </h3>
            
            <div className="form-group">
              <label htmlFor="res-date">Select Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  id="res-date"
                  type="date"
                  className="form-control"
                  value={date}
                  min={getMinDate()}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="res-slot">Time Slot</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <select
                  id="res-slot"
                  className="form-control"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%', appearance: 'none', backgroundPosition: 'right 12px center' }}
                >
                  <option value="12:00-14:00">Lunch Slot 1 (12:00 PM - 02:00 PM)</option>
                  <option value="14:00-16:00">Lunch Slot 2 (02:00 PM - 04:00 PM)</option>
                  <option value="18:00-20:00">Dinner Slot 1 (06:00 PM - 08:00 PM)</option>
                  <option value="20:00-22:00">Dinner Slot 2 (08:00 PM - 10:00 PM)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="res-guests">Number of Guests</label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                  id="res-guests"
                  type="number"
                  className="form-control"
                  min="1"
                  max="12"
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value) || 1)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  required
                />
              </div>
            </div>

            {selectedTable && (
              <div className="glass-panel animated-fade-in" style={{ padding: '1rem', marginTop: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Selected Dining Space</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedTable.tableNumber}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 500 }}>
                    Fits {selectedTable.capacity} guests
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleBooking}
              className="btn btn-primary"
              disabled={!selectedTable || bookingLoading}
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
            >
              <Check size={18} />
              <span>{bookingLoading ? 'Confirming Booking...' : 'Book Selection'}</span>
            </button>
          </div>
        </div>

        {/* Right Side: Floor Map Visualizer */}
        <div className="col-content">
          <div className="glass-panel" style={{ padding: '1.75rem', height: '100%' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Restaurant Table Map
            </h3>
            
            {/* Status Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', marginBottom: '2rem', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981' }} />
                <span style={{ color: '#a7f3d0' }}>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }} />
                <span style={{ color: '#fca5a5' }}>Already Booked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
                <span style={{ color: 'var(--color-muted)' }}>Too Small (Under Capacity)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.3)', border: '2px solid #6366f1' }} />
                <span style={{ color: 'white', fontWeight: 500 }}>Your Selection</span>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <div style={{ border: '3px solid rgba(99, 102, 241, 0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : tables.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                No tables defined. Please contact the administrator.
              </div>
            ) : (
              <div>
                <div style={{ border: '1.5px dashed rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '2rem 1.5rem', background: 'rgba(0, 0, 0, 0.1)' }}>
                  {/* Entrance indicator */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255, 255, 255, 0.08)', padding: '0.25rem 1rem', borderRadius: '4px', color: 'var(--color-muted)' }}>
                      Main Dining Hall Entrance
                    </span>
                  </div>

                  <div className="table-grid">
                    {tables.map((table) => {
                      const status = getTableStatus(table);
                      const isSelected = selectedTable && selectedTable._id === table._id;
                      
                      let displayClass = 'table-node ';
                      if (isSelected) displayClass += 'selected';
                      else if (status === 'booked') displayClass += 'booked';
                      else if (status === 'too-small') displayClass += 'too-small';
                      else displayClass += 'available';

                      const handleClick = () => {
                        if (status === 'available') {
                          setSelectedTable(table);
                        }
                      };

                      return (
                        <div
                          key={table._id}
                          className={displayClass}
                          onClick={handleClick}
                        >
                          <span style={{ fontSize: '1rem', fontWeight: 600 }}>{table.tableNumber}</span>
                          <span className="capacity-badge">
                            Cap: {table.capacity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                  <AlertCircle size={14} />
                  <span>Only green tables matching your guest count of <strong>{guestsCount}</strong> can be selected.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReservation;
