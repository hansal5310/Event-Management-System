const express = require('express');
const router = express.Router();
const User = require('./models/User');
const Event = require('./models/Event');
const RSVP = require('./models/RSVP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Test route
router.get('/hello', (req, res) => {
  res.json({ message: 'Welcome to the MERN backend!' });
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      email, 
      password: hashedPassword, 
      role: role || 'User' 
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      user: { 
        id: newUser._id, 
        email: newUser.email, 
        role: newUser.role 
      }, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '1h' }
    );

    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ 
      message: 'Failed to fetch event',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Create event (Admin only)
router.post('/events', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const { title, description, date, venue, maxTickets, bannerImage } = req.body;
    
    if (!title || !description || !date || !venue || !maxTickets) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = new Event({
      title,
      description,
      date,
      venue,
      maxTickets,
      bannerImage: bannerImage || 'https://via.placeholder.com/300',
      createdBy: req.user.id,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(400).json({ message: 'Failed to create event' });
  }
});

// Update event (Admin only)
router.put('/events/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(400).json({ message: 'Failed to update event' });
  }
});

// Delete event (Admin only)
router.delete('/events/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    await RSVP.deleteMany({ event: req.params.id });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Create RSVP
router.post('/rsvps', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingRSVP = await RSVP.findOne({ 
      event: eventId, 
      user: req.user.id 
    });
    
    if (existingRSVP) {
      return res.status(400).json({ message: 'Already RSVP\'d to this event' });
    }

    const rsvpCount = await RSVP.countDocuments({ event: eventId });
    if (rsvpCount >= event.maxTickets) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const rsvp = new RSVP({
      event: eventId,
      user: req.user.id,
      ticketId: uuidv4(),
    });

    await rsvp.save();
    res.status(201).json(rsvp);
  } catch (err) {
    console.error('Error creating RSVP:', err);
    res.status(500).json({ message: 'Failed to create RSVP' });
  }
});

// Get user RSVPs
router.get('/rsvps', authMiddleware, async (req, res) => {
  try {
    const rsvps = await RSVP.find({ user: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });
      
    res.json(rsvps);
  } catch (err) {
    console.error('Error fetching RSVPs:', err);
    res.status(500).json({ message: 'Failed to fetch RSVPs' });
  }
});

// Cancel RSVP
router.delete('/rsvps/:id', authMiddleware, async (req, res) => {
  try {
    const rsvp = await RSVP.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!rsvp) {
      return res.status(404).json({ message: 'RSVP not found' });
    }
    
    res.json({ message: 'RSVP cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling RSVP:', err);
    res.status(500).json({ message: 'Failed to cancel RSVP' });
  }
});

// Get dashboard stats (Admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const [totalEvents, totalRSVPs, activeUsers] = await Promise.all([
      Event.countDocuments(),
      RSVP.countDocuments(),
      User.countDocuments()
    ]);
    
    res.json({ totalEvents, totalRSVPs, activeUsers });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;