const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Ticket Info
  ticketId: { type: String, required: true, unique: true },
  ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  
  // Personal Info
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  
  // Additional Fields (dynamic based on event)
  additionalInfo: { type: Map, of: String },
  
  // Status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'CheckedIn', 'Waitlist'],
    default: 'Confirmed'
  },
  
  // Payment
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  
  // Check-in
  checkedIn: { type: Boolean, default: false },
  checkInTime: { type: Date },
  
  // Guest Management
  plusOne: { type: Boolean, default: false },
  guestName: { type: String },
  guestEmail: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RSVP', rsvpSchema);