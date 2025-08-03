import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode.react';

const QRCodeTicket = ({ user }) => {
  const { rsvpId } = useParams();
  const [rsvp, setRsvp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRSVP = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get('http://localhost:5000/api/rsvps', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rsvpData = res.data.find(r => r._id === rsvpId);
        
        if (!rsvpData) {
          setError('Ticket not found');
          return;
        }
        
        setRsvp(rsvpData);
      } catch (err) {
        console.error('Error fetching RSVP:', err);
        setError('Failed to load ticket. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchRSVP();
  }, [user, rsvpId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a downloadable version of the ticket
    const canvas = document.querySelector('#qr-code canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `ticket-${rsvp.ticketId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${rsvp.event.title}`,
          text: `My ticket for ${rsvp.event.title} on ${new Date(rsvp.event.date).toLocaleDateString()}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Ticket link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="qr-ticket-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-ticket-container">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!rsvp) {
    return (
      <div className="qr-ticket-container">
        <div className="error-message">
          <div className="error-icon">🎫</div>
          <h3>Ticket Not Found</h3>
          <p>We couldn't find the ticket you're looking for.</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(rsvp.event.date);
  const isEventPast = eventDate < new Date();

  return (
    <div className="qr-ticket-container">
      {/* Header */}
      <div className="ticket-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1 className="ticket-title">Your Event Ticket</h1>
        <div className="ticket-actions">
          <button onClick={handlePrint} className="action-btn print-btn">
            🖨️ Print
          </button>
          <button onClick={handleShare} className="action-btn share-btn">
            📤 Share
          </button>
        </div>
      </div>

      {/* Main Ticket */}
      <div className="ticket-wrapper">
        <div className={`event-ticket ${isEventPast ? 'past-event' : ''}`}>
          {/* Ticket Background Pattern */}
          <div className="ticket-bg-pattern"></div>
          
          {/* Event Status Badge */}
          <div className={`event-status ${isEventPast ? 'past' : 'upcoming'}`}>
            {isEventPast ? '✓ Completed' : '🎉 Upcoming'}
          </div>

          {/* Event Banner */}
          <div className="event-banner">
            <img 
              src={rsvp.event.bannerImage || 'https://via.placeholder.com/400x200/819067/fefae0?text=Event+Image'} 
              alt={rsvp.event.title}
              className="event-image"
            />
            <div className="event-overlay">
              <h2 className="event-title">{rsvp.event.title}</h2>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="ticket-content">
            {/* Event Details */}
            <div className="event-details">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div className="detail-info">
                    <span className="detail-label">Date & Time</span>
                    <span className="detail-value">
                      {eventDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="detail-time">
                      {eventDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">📍</div>
                  <div className="detail-info">
                    <span className="detail-label">Venue</span>
                    <span className="detail-value">{rsvp.event.venue}</span>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">👤</div>
                  <div className="detail-info">
                    <span className="detail-label">Attendee</span>
                    <span className="detail-value">{rsvp.name}</span>
                    <span className="detail-email">{rsvp.email}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">🎫</div>
                  <div className="detail-info">
                    <span className="detail-label">Ticket ID</span>
                    <span className="detail-value ticket-id">{rsvp.ticketId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="qr-section">
              <div className="qr-container" id="qr-code">
                <div className="qr-border">
                  <QRCode 
                    value={JSON.stringify({
                      ticketId: rsvp.ticketId,
                      eventId: rsvp.event._id,
                      attendee: rsvp.name,
                      email: rsvp.email
                    })}
                    size={160}
                    level="H"
                    renderAs="canvas"
                    bgColor="#fefae0"
                    fgColor="#0a400c"
                  />
                </div>
                <p className="qr-instruction">
                  Show this QR code at the venue for entry
                </p>
              </div>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="ticket-footer">
            <div className="footer-text">
              <p>Keep this ticket safe and bring it to the event</p>
              <p className="disclaimer">This ticket is non-transferable and valid for one person only</p>
            </div>
            <div className="company-logo">
              <div className="logo-circle">E</div>
              <span>EventHub</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="ticket-perforations">
            <div className="perforation perforation-left"></div>
            <div className="perforation perforation-right"></div>
          </div>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="additional-actions">
        <button onClick={handleDownload} className="secondary-btn">
          💾 Download QR Code
        </button>
        <button onClick={() => navigate('/dashboard')} className="secondary-btn">
          🏠 Back to Dashboard
        </button>
      </div>

      {/* Event Description */}
      {rsvp.event.description && (
        <div className="event-description-card">
          <h3>About This Event</h3>
          <p>{rsvp.event.description}</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeTicket;