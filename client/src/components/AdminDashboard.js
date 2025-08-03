import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState({ totalEvents: 0, totalRSVPs: 0, activeUsers: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:5000/api/events', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);
        setStats(statsRes.data);
        setEvents(eventsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'Admin') fetchData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`http://localhost:5000/api/events/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setEvents(events.filter(event => event._id !== id));
      } catch (err) {
        console.error('Error deleting event:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-modern">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🎯</div>
            <h2>EventPro</h2>
          </div>
          <div className="admin-profile">
            <div className="profile-avatar">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <span className="profile-name">Admin</span>
              <span className="profile-email">{user?.email}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className="nav-item"
            onClick={() => navigate('/create-event')}
          >
            <span className="nav-icon">➕</span>
            Create Event
          </button>
          <button 
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <span className="nav-icon">🎪</span>
            Manage Events
          </button>
          <button 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="main-header">
          <div className="header-content">
            <h1>Admin Dashboard</h1>
            <div className="header-actions">
              <button 
                className="primary-btn"
                onClick={() => navigate('/create-event')}
              >
                + New Event
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <section className="stats-grid">
              <div className="stat-card events">
                <div className="stat-icon">🎪</div>
                <div className="stat-content">
                  <h3>Total Events</h3>
                  <p className="stat-number">{stats.totalEvents}</p>
                  <span className="stat-trend">+12% from last month</span>
                </div>
              </div>
              <div className="stat-card rsvps">
                <div className="stat-icon">🎫</div>
                <div className="stat-content">
                  <h3>Total RSVPs</h3>
                  <p className="stat-number">{stats.totalRSVPs}</p>
                  <span className="stat-trend">+8% from last month</span>
                </div>
              </div>
              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <p className="stat-number">{stats.activeUsers}</p>
                  <span className="stat-trend">+15% from last month</span>
                </div>
              </div>
            </section>

            {/* Recent Events Preview */}
            <section className="recent-events">
              <h2>Recent Events</h2>
              <div className="events-preview">
                {events.slice(0, 3).map(event => (
                  <div key={event._id} className="event-preview-card">
                    <img 
                      src={event.bannerImage || 'https://via.placeholder.com/300'} 
                      alt={event.title}
                      className="preview-image"
                    />
                    <div className="preview-content">
                      <h4>{event.title}</h4>
                      <p>{new Date(event.date).toLocaleDateString()}</p>
                      <span className="venue">{event.venue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'events' && (
          <section className="events-management">
            <div className="section-header">
              <h2>Manage Events</h2>
              <div className="table-actions">
                <input 
                  type="search" 
                  placeholder="Search events..."
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="events-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>RSVPs</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id}>
                      <td>
                        <div className="event-cell">
                          <img 
                            src={event.bannerImage || 'https://via.placeholder.com/50'} 
                            alt={event.title}
                            className="table-image"
                          />
                          <div>
                            <div className="event-title">{event.title}</div>
                            <div className="event-desc">{event.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <div>{new Date(event.date).toLocaleDateString()}</div>
                          <div className="time">{new Date(event.date).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td>{event.venue}</td>
                      <td>
                        <span className="rsvp-count">0 / {event.maxTickets}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${new Date(event.date) > new Date() ? 'active' : 'past'}`}>
                          {new Date(event.date) > new Date() ? 'Active' : 'Past'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => navigate(`/edit-event/${event._id}`)} 
                            className="edit-btn"
                            title="Edit Event"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(event._id)} 
                            className="delete-btn"
                            title="Delete Event"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;