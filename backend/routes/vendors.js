const express = require('express');
const router = express.Router();
const User = require('../models/User');
const VendorBooking = require('../models/VendorBooking');

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const { type, city, rating } = req.query;
    
    let query = { role: 'Vendor', verified: true };
    
    if (type) query.vendorType = type;
    if (city) query.serviceArea = city;
    if (rating) query.rating = { $gte: parseInt(rating) };
    
    const vendors = await User.find(query).select('-password');
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Get vendor details
router.get('/:id', async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id).select('-password');
    if (!vendor || vendor.role !== 'Vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vendor' });
  }
});

// Create booking request
router.post('/book', async (req, res) => {
  try {
    const { eventId, vendorId, serviceType, description, requirements } = req.body;
    
    const booking = new VendorBooking({
      event: eventId,
      vendor: vendorId,
      organizer: req.user.id,
      serviceType,
      description,
      requirements,
      status: 'Requested'
    });
    
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

// Update booking status (vendor)
router.put('/booking/:id/status', async (req, res) => {
  try {
    const { status, quotedPrice } = req.body;
    
    const booking = await VendorBooking.findById(req.params.id);
    
    if (booking.vendor.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    booking.status = status;
    if (quotedPrice) booking.quotedPrice = quotedPrice;
    booking.updatedAt = new Date();
    
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

// Get vendor bookings
router.get('/bookings/my', async (req, res) => {
  try {
    const bookings = await VendorBooking.find({ vendor: req.user.id })
      .populate('event')
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
