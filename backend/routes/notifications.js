const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User'); // <-- added import
const nodemailer = require('nodemailer'); // npm install nodemailer

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { userId, type, title, message, eventId } = req.body;
    
    // Basic validation so we fail fast with a clear error
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ message: 'Missing required fields for notification' });
    }
    
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      event: eventId
    });
    
    await notification.save();
    
    // Send email notification (non-blocking for main response)
    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: title,
          html: `
            <h2>${title}</h2>
            <p>${message}</p>
            ${eventId ? `<a href="${process.env.FRONTEND_URL}/events/${eventId}">View Event</a>` : ''}
          `
        });
      }
    } catch (mailErr) {
      // Log but don't fail the request — email problems are common (credentials, network)
      console.warn('Notification email send failed:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }
    
    res.json({ success: true, message: 'Notification saved and email attempted' });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Get user notifications
router.get('/my', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

module.exports = router;