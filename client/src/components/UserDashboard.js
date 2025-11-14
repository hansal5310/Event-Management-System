import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/textColors.css'; // <-- added import


const UserDashboard = ({ user }) => {
  const [rsvps, setRSVPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRSVPs: 0,
    upcomingEvents: 0,
    pastEvents: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/rsvps', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRSVPs(res.data);
        
        // Calculate stats
        const now = new Date();
        const upcoming = res.data.filter(rsvp => new Date(rsvp.event.date) > now);
        const past = res.data.filter(rsvp => new Date(rsvp.event.date) <= now);
        
        setStats({
          totalRSVPs: res.data.length,
          upcomingEvents: upcoming.length,
          pastEvents: past.length
        });
      } catch (err) {
        console.error('Error fetching RSVPs:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchRSVPs();
  }, [user]);

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this RSVP?')) {
      try {
        await axios.delete(`http://localhost:5000/api/rsvps/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRSVPs(rsvps.filter(rsvp => rsvp._id !== id));
        
        // Update stats
        const updatedRSVPs = rsvps.filter(rsvp => rsvp._id !== id);
        const now = new Date();
        const upcoming = updatedRSVPs.filter(rsvp => new Date(rsvp.event.date) > now);
        const past = updatedRSVPs.filter(rsvp => new Date(rsvp.event.date) <= now);
        
        setStats({
          totalRSVPs: updatedRSVPs.length,
          upcomingEvents: upcoming.length,
          pastEvents: past.length
        });
      } catch (err) {
        console.error('Error cancelling RSVP:', err);
      }
    }
  };

  const upcomingRSVPs = rsvps.filter(rsvp => new Date(rsvp.event.date) > new Date());
  const pastRSVPs = rsvps.filter(rsvp => new Date(rsvp.event.date) <= new Date());

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-modern">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="welcome-section">
              <h1 className="fill-text">Welcome back!</h1>
              <p>Here's what's happening with your events</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="browse-btn"
              onClick={() => navigate('/user-events')}
            >
              <span className="btn-icon">🎪</span>
              Browse Events
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Profile Section */}
        <section className="profile-section">
          <div className="profile-card">
            <div className="profile-avatar-large">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <h2>Your Profile</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-value role">{user?.role}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member since:</span>
                  <span className="info-value">Recently</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">🎫</div>
              <div className="stat-content">
                <h3>Total RSVPs</h3>
                <p className="stat-number">{stats.totalRSVPs}</p>
                <span className="stat-description">All time events</span>
              </div>
            </div>
            <div className="stat-card upcoming">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <h3>Upcoming</h3>
                <p className="stat-number">{stats.upcomingEvents}</p>
                <span className="stat-description">Events to attend</span>
              </div>
            </div>
            <div className="stat-card past">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Attended</h3>
                <p className="stat-number">{stats.pastEvents}</p>
                <span className="stat-description">Past events</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="events-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            {upcomingRSVPs.length > 0 && (
              <span className="event-count">{upcomingRSVPs.length} event{upcomingRSVPs.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          
          {upcomingRSVPs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎪</div>
              <h3>No upcoming events</h3>
              <p>You haven't RSVPed to any upcoming events yet.</p>
              <button 
                className="browse-events-btn"
                onClick={() => navigate('/events')}
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="events-list">
              {upcomingRSVPs.map(rsvp => {
                const eventDate = new Date(rsvp.event.date);
                const isToday = eventDate.toDateString() === new Date().toDateString();
                const daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={rsvp._id} className={`event-card ${isToday ? 'today' : ''}`}>
                    <div className="event-image">
                      <img
                        src={rsvp.event.bannerImage || 'https://via.placeholder.com/300x200/0a400c/fefae0?text=Event'}
                        alt={rsvp.event.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200/0a400c/fefae0?text=Event';
                        }}
                      />
                      {isToday && <div className="today-badge">Today!</div>}
                      {daysUntil === 1 && !isToday && <div className="tomorrow-badge">Tomorrow</div>}
                    </div>
                    
                    <div className="event-info">
                      <div className="event-header">
                        <h3>{rsvp.event.title}</h3>
                        <div className="event-date">
                          <span className="date">
                            {eventDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="time">
                            {eventDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="event-details">
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span>{rsvp.event.venue}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">🎫</span>
                          <span>Ticket ID: {rsvp.ticketId}</span>
                        </div>
                      </div>
                      
                      <div className="event-actions">
                        <button 
                          className="view-ticket-btn"
                          onClick={() => navigate(`/ticket/${rsvp._id}`)}
                        >
                          <span className="btn-icon">🎟️</span>
                          View Ticket
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => handleCancel(rsvp._id)}
                        >
                          <span className="btn-icon">❌</span>
                          Cancel RSVP
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastRSVPs.length > 0 && (
          <section className="events-section past-events">
            <div className="section-header">
              <h2>Past Events</h2>
              <span className="event-count">{pastRSVPs.length} event{pastRSVPs.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="events-list past">
              {pastRSVPs.slice(0, 3).map(rsvp => (
                <div key={rsvp._id} className="event-card past">
                  <div className="event-image">
                    <img
                      src={rsvp.event.bannerImage || 'https://via.placeholder.com/300x200/666666/ffffff?text=Past+Event'}
                      alt={rsvp.event.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200/666666/ffffff?text=Past+Event';
                      }}
                    />
                    <div className="past-badge">Attended</div>
                  </div>
                  
                  <div className="event-info">
                    <div className="event-header">
                      <h3>{rsvp.event.title}</h3>
                      <div className="event-date">
                        <span className="date">
                          {new Date(rsvp.event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="event-details">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{rsvp.event.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {pastRSVPs.length > 3 && (
              <div className="show-more">
                <p>And {pastRSVPs.length - 3} more past events...</p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;