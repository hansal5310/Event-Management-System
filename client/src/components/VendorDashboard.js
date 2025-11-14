import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VendorDashboard = ({ user, onLogout }) => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingRequests: 0,
    activeJobs: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const bookingsRes = await axios.get(
        'http://localhost:5000/api/vendors/bookings/my',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBookings(bookingsRes.data);
      
      // Calculate stats
      const stats = {
        totalBookings: bookingsRes.data.length,
        pendingRequests: bookingsRes.data.filter(b => b.status === 'Requested').length,
        activeJobs: bookingsRes.data.filter(b => b.status === 'Accepted').length,
        totalEarnings: bookingsRes.data
          .filter(b => b.status === 'Completed')
          .reduce((sum, b) => sum + (b.finalPrice || 0), 0)
      };
      
      setStats(stats);
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status, quotedPrice) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/vendors/booking/${bookingId}/status`,
        { status, quotedPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchVendorData();
    } catch (err) {
      console.error('Error updating booking:', err);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="vendor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Vendor Dashboard</h1>
          <div className="header-actions">
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Total Bookings</h3>
              <p className="stat-number">{stats.totalBookings}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>Pending Requests</h3>
              <p className="stat-number">{stats.pendingRequests}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Active Jobs</h3>
              <p className="stat-number">{stats.activeJobs}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Total Earnings</h3>
              <p className="stat-number">₹{stats.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bookings List */}
      <section className="bookings-section">
        <h2>My Bookings</h2>
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.event.title}</h3>
                <span className={`status-badge ${booking.status.toLowerCase()}`}>
                  {booking.status}
                </span>
              </div>
              
              <div className="booking-details">
                <p><strong>Service:</strong> {booking.serviceType}</p>
                <p><strong>Event Date:</strong> {new Date(booking.event.date).toLocaleDateString()}</p>
                <p><strong>Organizer:</strong> {booking.organizer.name}</p>
                <p><strong>Requirements:</strong> {booking.requirements}</p>
              </div>

              {booking.status === 'Requested' && (
                <div className="booking-actions">
                  <input 
                    type="number" 
                    placeholder="Enter quoted price"
                    id={`price-${booking._id}`}
                    className="price-input"
                  />
                  <button 
                    onClick={() => {
                      const price = document.getElementById(`price-${booking._id}`).value;
                      updateBookingStatus(booking._id, 'Quoted', parseFloat(price));
                    }}
                    className="accept-btn"
                  >
                    Send Quote
                  </button>
                  <button 
                    onClick={() => updateBookingStatus(booking._id, 'Rejected')}
                    className="reject-btn"
                  >
                    Reject
                  </button>
                </div>
              )}

              {booking.quotedPrice && (
                <p className="quoted-price">Quoted Price: ₹{booking.quotedPrice}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VendorDashboard;