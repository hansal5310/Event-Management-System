import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const RSVPPage = ({ user, apiBaseUrl = 'http://localhost:5000' }) => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({ 
    name: user?.name || user?.email || '', 
    email: user?.email || '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get(`${apiBaseUrl}/api/events/${eventId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        setEvent(res.data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err.response?.data?.message || 'Failed to load event. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvent();
  }, [user, eventId, navigate, apiBaseUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${apiBaseUrl}/api/rsvps`,
        { 
          eventId,
          name: formData.name.trim(),
          email: formData.email.trim()
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      // Show success animation before navigating
      setShowConfirmation(true);
      setTimeout(() => {
        navigate(`/ticket/${res.data._id}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating RSVP:', err);
      setError(err.response?.data?.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isEventPast = () => {
    return new Date(event?.date) < new Date();
  };

  const getAvailableSpots = () => {
    if (!event) return 0;
    return Math.max(0, (event.maxTickets || 100) - (event.currentRSVPs || 0));
  };

  if (isLoading) {
    return (
      <div className="rsvp-container">
        <div className="loading-screen">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <h3>Loading Event Details...</h3>
          <p>Please wait while we fetch the event information</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="rsvp-container">
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-btn">
              🔄 Retry
            </button>
            <button onClick={() => navigate(-1)} className="back-btn">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="rsvp-container">
        <div className="error-screen">
          <div className="error-icon">🎫</div>
          <h3>Event Not Found</h3>
          <p>We couldn't find the event you're looking for.</p>
          <button onClick={() => navigate('/events')} className="back-btn">
            ← Browse Events
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="rsvp-container">
        <div className="confirmation-screen">
          <div className="success-animation">
            <div className="checkmark">✓</div>
          </div>
          <h3>RSVP Confirmed!</h3>
          <p>Your ticket is being generated...</p>
        </div>
      </div>
    );
  }

  const eventPast = isEventPast();
  const availableSpots = getAvailableSpots();

  return (
    <div className="rsvp-container">
      {/* Header Navigation */}
      <div className="rsvp-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Events
        </button>
        <div className="header-actions">
          <button onClick={() => navigate('/user-dashboard')} className="dashboard-btn">
            🏠 Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="rsvp-content">
        {/* Event Hero Section */}
        <div className="event-hero">
          <div className="event-image-container">
            <img 
              src={event.bannerImage || 'https://via.placeholder.com/800x400/819067/fefae0?text=Event+Image'} 
              alt={event.title} 
              className="event-hero-image" 
            />
            <div className="event-overlay">
              <div className="event-badges">
                {eventPast && <span className="badge past">Past Event</span>}
                {!eventPast && availableSpots <= 10 && <span className="badge limited">Limited Spots</span>}
                {!eventPast && availableSpots === 0 && <span className="badge sold-out">Sold Out</span>}
              </div>
            </div>
          </div>
          
          <div className="event-title-section">
            <h1 className="event-title">{event.title}</h1>
            <div className="event-meta">
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span className="meta-text">{formatDate(event.date)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span className="meta-text">{event.venue}</span>
              </div>
              <div className="meta-item">
                <span className="meta-icon">🎫</span>
                <span className="meta-text">
                  {availableSpots > 0 ? `${availableSpots} spots available` : 'Event full'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Description */}
        <div className="event-description">
          <h3>About This Event</h3>
          <p>{event.description}</p>
        </div>

        {/* RSVP Form Section */}
        <div className="rsvp-form-container">
          <div className="form-header">
            <h2>Reserve Your Spot</h2>
            <p>Fill in your details to confirm your attendance</p>
          </div>

          {/* Event Status Messages */}
          {eventPast && (
            <div className="status-message past-event">
              <span className="status-icon">⏰</span>
              <div className="status-content">
                <h4>This event has already ended</h4>
                <p>You can no longer RSVP for this event.</p>
              </div>
            </div>
          )}

          {!eventPast && availableSpots === 0 && (
            <div className="status-message sold-out">
              <span className="status-icon">🎫</span>
              <div className="status-content">
                <h4>Event is fully booked</h4>
                <p>All available spots have been reserved.</p>
              </div>
            </div>
          )}

          {!eventPast && availableSpots > 0 && (
            <form onSubmit={handleSubmit} className="rsvp-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="label-icon">👤</span>
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className={error ? 'error' : ''}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">✉️</span>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className={error ? 'error' : ''}
                  />
                </div>
              </div>

              {error && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-footer">
                <div className="rsvp-info">
                  <p className="rsvp-note">
                    <span className="info-icon">ℹ️</span>
                    Your ticket will be sent to your email address
                  </p>
                </div>
                
                <button 
                  type="submit" 
                  className={`rsvp-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🎫</span>
                      Confirm RSVP
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Additional Event Info */}
          <div className="additional-info">
            <div className="info-cards">
              <div className="info-card">
                <div className="card-icon">🕒</div>
                <div className="card-content">
                  <h4>Event Duration</h4>
                  <p>Please arrive 15 minutes early</p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="card-icon">📱</div>
                <div className="card-content">
                  <h4>Digital Ticket</h4>
                  <p>Show QR code on your phone</p>
                </div>
              </div>
              
              <div className="info-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h4>Free Cancellation</h4>
                  <p>Cancel anytime before the event</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSVPPage;