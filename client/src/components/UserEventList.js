import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const UserEventList = ({ user, onLogout }) => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setEvents(res.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchEvents();
  }, [user]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                         event.venue.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'upcoming') {
      return matchesSearch && new Date(event.date) > new Date();
    } else if (filter === 'past') {
      return matchesSearch && new Date(event.date) <= new Date();
    }
    
    return matchesSearch;
  });

  const handleRSVP = (eventId) => {
    console.log('Navigating to RSVP for event ID:', eventId);
    navigate(`/rsvp/${eventId}`);
  };

  if (loading) {
    return (
      <div className="events-loading">
        <div className="loading-spinner"></div>
        <p>Loading amazing events...</p>
      </div>
    );
  }

  return (
    <div className="user-events-modern">
      {/* Header */}
      <header className="events-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Discover Events</h1>
            <p>Find and join amazing events in your area</p>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="profile-avatar">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <span className="profile-name">Welcome back!</span>
                <span className="profile-email">{user?.email}</span>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      <section className="events-controls">
        <div className="controls-container">
          <div className="search-section">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search events by title or venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-section">
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All Events ({events.length})
              </button>
              <button 
                className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming ({events.filter(e => new Date(e.date) > new Date()).length})
              </button>
              <button 
                className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
                onClick={() => setFilter('past')}
              >
                Past ({events.filter(e => new Date(e.date) <= new Date()).length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="events-section">
        {filteredEvents.length === 0 ? (
          <div className="no-events">
            <div className="no-events-icon">🎪</div>
            <h3>No events found</h3>
            <p>
              {search ? 
                `No events match "${search}". Try adjusting your search.` : 
                'No events available at the moment. Check back later!'
              }
            </p>
            {search && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearch('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => {
              const eventDate = new Date(event.date);
              const isUpcoming = eventDate > new Date();
              const isToday = eventDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={event._id} className={`event-card ${!isUpcoming ? 'past-event' : ''}`}>
                  <div className="event-image-container">
                    <img
                      src={event.bannerImage || 'https://via.placeholder.com/400x240/0a400c/fefae0?text=Event+Image'}
                      alt={event.title}
                      className="event-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x240/0a400c/fefae0?text=Event+Image';
                      }}
                    />
                    {isToday && (
                      <div className="event-badge today">Today</div>
                    )}
                    {!isUpcoming && (
                      <div className="event-badge past">Past Event</div>
                    )}
                  </div>
                  
                  <div className="event-content">
                    <div className="event-header">
                      <h3 className="event-title">{event.title}</h3>
                      <div className="event-date">
                        <span className="date-icon">📅</span>
                        <div className="date-info">
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
                    </div>
                    
                    <div className="event-details">
                      <div className="event-venue">
                        <span className="venue-icon">📍</span>
                        <span>{event.venue}</span>
                      </div>
                      
                      <div className="event-tickets">
                        <span className="tickets-icon">🎫</span>
                        <span>{event.maxTickets} tickets available</span>
                      </div>
                    </div>
                    
                    <p className="event-description">
                      {event.description?.length > 100 
                        ? `${event.description.substring(0, 100)}...` 
                        : event.description || 'Join us for this amazing event!'
                      }
                    </p>
                    
                    <div className="event-actions">
                      {isUpcoming ? (
                        <button
                          onClick={() => handleRSVP(event._id)}
                          className="rsvp-btn primary"
                        >
                          <span className="btn-icon">🎯</span>
                          RSVP Now
                        </button>
                      ) : (
                        <button className="rsvp-btn disabled" disabled>
                          <span className="btn-icon">⏰</span>
                          Event Ended
                        </button>
                      )}
                      
                      <button className="details-btn">
                        <span className="btn-icon">👁️</span>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => navigate('/user-dashboard')}
        >
          <span className="action-icon">👤</span>
          My Dashboard
        </button>
      </div>
    </div>
  );
};

export default UserEventList;