const express = require('express');
const router = express.Router();
const CheckIn = require('../models/CheckIn');
const RSVP = require('../models/RSVP');
const QRCode = require('qrcode');

// Verify and check-in attendee
router.post('/verify', async (req, res) => {
  try {
    const { ticketId, eventId } = req.body;
    
    const rsvp = await RSVP.findOne({ 
      ticketId, 
      event: eventId 
    }).populate('event');
    
    if (!rsvp) {
      return res.status(404).json({ message: 'Invalid ticket' });
    }
    
    if (rsvp.checkedIn) {
      return res.status(400).json({ 
        message: 'Already checked in',
        checkInTime: rsvp.checkInTime
      });
    }
    
    // Create check-in record
    const checkIn = new CheckIn({
      event: eventId,
      rsvp: rsvp._id,
      user: rsvp.user,
      checkedInBy: req.user.id,
      checkInMethod: 'QRCode'
    });
    
    await checkIn.save();
    
    // Update RSVP
    rsvp.checkedIn = true;
    rsvp.checkInTime = new Date();
    rsvp.status = 'CheckedIn';
    await rsvp.save();
    
    res.json({ 
      success: true, 
      message: 'Check-in successful',
      attendee: {
        name: rsvp.name,
        email: rsvp.email,
        ticketType: rsvp.ticketType
      }
    });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Check-in failed' });
  }
});

// Get check-in statistics
router.get('/stats/:eventId', async (req, res) => {
  try {
    const totalRSVPs = await RSVP.countDocuments({ 
      event: req.params.eventId,
      status: { $in: ['Confirmed', 'CheckedIn'] }
    });
    
    const checkedIn = await CheckIn.countDocuments({ event: req.params.eventId });
    
    const checkIns = await CheckIn.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ checkInTime: -1 });
    
    res.json({
      totalRSVPs,
      checkedIn,
      pending: totalRSVPs - checkedIn,
      checkInRate: ((checkedIn / totalRSVPs) * 100).toFixed(2),
      recentCheckIns: checkIns.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch check-in stats' });
  }
});

// Manual check-in
router.post('/manual', async (req, res) => {
  try {
    const { rsvpId, notes } = req.body;
    
    const rsvp = await RSVP.findById(rsvpId);
    
    if (!rsvp) {
      return res.status(404).json({ message: 'RSVP not found' });
    }
    
    if (rsvp.checkedIn) {
      return res.status(400).json({ message: 'Already checked in' });
    }
    
    const checkIn = new CheckIn({
      event: rsvp.event,
      rsvp: rsvpId,
      user: rsvp.user,
      checkedInBy: req.user.id,
      checkInMethod: 'Manual',
      notes
    });
    
    await checkIn.save();
    
    rsvp.checkedIn = true;
    rsvp.checkInTime = new Date();
    rsvp.status = 'CheckedIn';
    await rsvp.save();
    
    res.json({ success: true, message: 'Manual check-in successful' });
  } catch (err) {
    res.status(500).json({ message: 'Manual check-in failed' });
  }
});

module.exports = router;