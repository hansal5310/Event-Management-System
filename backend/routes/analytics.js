const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const Payment = require('../models/Payment');
const CheckIn = require('../models/CheckIn');

// Event analytics
router.get('/event/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get RSVPs
    const rsvps = await RSVP.find({ event: req.params.id });
    const totalRSVPs = rsvps.length;
    const confirmedRSVPs = rsvps.filter(r => r.status === 'Confirmed').length;
    const checkedIn = rsvps.filter(r => r.checkedIn).length;
    
    // Get payments
    const payments = await Payment.find({ event: req.params.id });
    const totalRevenue = payments
      .filter(p => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    // Ticket types breakdown
    const ticketTypeBreakdown = {};
    rsvps.forEach(rsvp => {
      const type = rsvp.ticketType?.toString() || 'General';
      ticketTypeBreakdown[type] = (ticketTypeBreakdown[type] || 0) + 1;
    });
    
    // Demographics
    const registrationDates = rsvps.map(r => r.createdAt);
    const dailyRegistrations = {};
    registrationDates.forEach(date => {
      const day = date.toISOString().split('T')[0];
      dailyRegistrations[day] = (dailyRegistrations[day] || 0) + 1;
    });
    
    res.json({
      event: {
        title: event.title,
        date: event.date,
        venue: event.venue
      },
      rsvps: {
        total: totalRSVPs,
        confirmed: confirmedRSVPs,
        checkedIn: checkedIn,
        checkInRate: ((checkedIn / totalRSVPs) * 100).toFixed(2)
      },
      revenue: {
        total: totalRevenue,
        currency: 'INR',
        averageTicketPrice: (totalRevenue / totalRSVPs).toFixed(2)
      },
      ticketTypes: ticketTypeBreakdown,
      timeline: dailyRegistrations
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all events by user
    const events = await Event.find({ createdBy: userId });
    const eventIds = events.map(e => e._id);
    
    // Get total RSVPs
    const totalRSVPs = await RSVP.countDocuments({ event: { $in: eventIds } });
    
    // Get total revenue
    const payments = await Payment.find({ 
      event: { $in: eventIds },
      status: 'Completed'
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Get upcoming events
    const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
    
    // Recent activity
    const recentRSVPs = await RSVP.find({ event: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('event', 'title');
    
    res.json({
      summary: {
        totalEvents: events.length,
        upcomingEvents,
        totalRSVPs,
        totalRevenue
      },
      recentActivity: recentRSVPs
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
