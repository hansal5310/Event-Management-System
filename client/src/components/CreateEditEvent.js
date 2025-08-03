import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';


const CreateEditEvent = ({ user }) => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    maxTickets: '',
    bannerImage: '',
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`http://localhost:5000/api/events/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });

          const toLocalInputDateTime = (isoString) => {
            const date = new Date(isoString);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - offset * 60000);
            return localDate.toISOString().slice(0, 16);
          };

          const eventData = {
            title: res.data.title,
            description: res.data.description,
            date: toLocalInputDateTime(res.data.date),
            venue: res.data.venue,
            maxTickets: res.data.maxTickets,
            bannerImage: res.data.bannerImage,
          };
          setFormData(eventData);
          setImagePreview(res.data.bannerImage);
        } catch (err) {
          console.error('Error fetching event:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, isEdit]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date and time is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.maxTickets || formData.maxTickets < 1)
      newErrors.maxTickets = 'Valid ticket count is required';
    if (
      formData.bannerImage &&
      !/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)$/.test(formData.bannerImage)
    ) {
      newErrors.bannerImage = 'Provide a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (name === 'bannerImage') {
      setImagePreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validateForm()) return;

    try {
      setLoading(true);
      const url = isEdit
        ? `http://localhost:5000/api/events/${id}`
        : 'http://localhost:5000/api/events';
      const method = isEdit ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      navigate('/admin-dashboard');
    } catch (err) {
      console.error('Error saving event:', err);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-edit-modern">
      <div className="form-container">
        <header className="form-header">
          <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>
            ← Back to Dashboard
          </button>
          <div className="form-content">
            <div className="form-grid">
              {/* Form */}
              <div className="form-fields">
                <form onSubmit={handleSubmit} className="modern-form">
                  {/* Title */}
                  <div className="form-group">
                    <label className="form-label">Event Title <span className="required">*</span></label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`form-input ${errors.title ? 'error' : ''}`}
                      placeholder="Enter an engaging event title"
                    />
                    {errors.title && <span className="error-message">{errors.title}</span>}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label className="form-label">Description <span className="required">*</span></label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`form-textarea ${errors.description ? 'error' : ''}`}
                      placeholder="Describe what makes this event special..."
                      rows="4"
                    />
                    {errors.description && <span className="error-message">{errors.description}</span>}
                  </div>

                  {/* Date and Tickets */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date & Time <span className="required">*</span></label>
                      <input
                        type="datetime-local"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`form-input ${errors.date ? 'error' : ''}`}
                      />
                      {errors.date && <span className="error-message">{errors.date}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Tickets <span className="required">*</span></label>
                      <input
                        type="number"
                        name="maxTickets"
                        value={formData.maxTickets}
                        onChange={handleChange}
                        className={`form-input ${errors.maxTickets ? 'error' : ''}`}
                        min="1"
                      />
                      {errors.maxTickets && <span className="error-message">{errors.maxTickets}</span>}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="form-group">
                    <label className="form-label">Venue <span className="required">*</span></label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      className={`form-input ${errors.venue ? 'error' : ''}`}
                      placeholder="Where will the event take place?"
                    />
                    {errors.venue && <span className="error-message">{errors.venue}</span>}
                  </div>

                  {/* Banner Image */}
                  <div className="form-group">
                    <label className="form-label">Banner Image URL <span className="optional">(Optional)</span></label>
                    <input
                      type="url"
                      name="bannerImage"
                      value={formData.bannerImage}
                      onChange={handleChange}
                      className={`form-input ${errors.bannerImage ? 'error' : ''}`}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="form-hint">Add an image URL to make your event more attractive</p>
                    {errors.bannerImage && <span className="error-message">{errors.bannerImage}</span>}
                  </div>

                  {/* Submit Error */}
                  {errors.submit && <div className="error-banner">{errors.submit}</div>}

                  {/* Action Buttons */}
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate('/admin-dashboard')} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          {isEdit ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          {isEdit ? '✓ Update Event' : '+ Create Event'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Event Preview */}
              <div className="event-preview">
                <div className="preview-header">
                  <h3>Event Preview</h3>
                  <p>See how your event will look to users</p>
                </div>
                <div className="preview-card">
                  <div className="preview-image-container">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="preview-image"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x200/0a400c/fefae0?text=Event+Image';
                        }}
                      />
                    ) : (
                      <div className="preview-placeholder">
                        <span className="placeholder-icon">🖼️</span>
                        <p>Event image will appear here</p>
                      </div>
                    )}
                  </div>
                  <div className="preview-content">
                    <h4 className="preview-title">{formData.title || 'Event Title'}</h4>
                    <div className="preview-details">
                      <div className="preview-detail">
                        <span className="detail-icon">📅</span>
                        <span>
                          {formData.date
                            ? new Date(formData.date).toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Date & Time'}
                        </span>
                      </div>
                      <div className="preview-detail">
                        <span className="detail-icon">📍</span>
                        <span>{formData.venue || 'Venue'}</span>
                      </div>
                      <div className="preview-detail">
                        <span className="detail-icon">🎫</span>
                        <span>
                          {formData.maxTickets
                            ? `${formData.maxTickets} tickets available`
                            : 'Ticket count'}
                        </span>
                      </div>
                    </div>
                    <p className="preview-description">
                      {formData.description || 'Event description will appear here...'}
                    </p>
                    <button className="preview-rsvp-btn" disabled>
                      RSVP Now
                    </button>
                  </div>
                </div>
              </div>
              {/* End Grid */}
            </div>
          </div>
        </header>
      </div>
    </div>
  );
};

export default CreateEditEvent;
