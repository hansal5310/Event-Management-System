const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Date and Time
  date: { type: Date, required: true },
  endDate: { type: Date },
  timezone: { type: String, default: 'Asia/Kolkata' },
  
  // Location
  venue: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pincode: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  
  // Capacity
  maxTickets: { type: Number, required: true },
  currentRSVPs: { type: Number, default: 0 },
  
  // Media
  bannerImage: { type: String },
  gallery: [String], // Array of image URLs
  
  // Organizer
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Categories and Tags
  category: { 
    type: String, 
    enum: ['Conference', 'Concert', 'Workshop', 'Wedding', 'Corporate', 'Social', 'Other'],
    default: 'Other'
  },
  tags: [String],
  
  // Schedule/Agenda
  agenda: [{
    time: Date,
    title: String,
    description: String,
    speaker: String,
    duration: Number // in minutes
  }],
  
  // Pricing
  isPaid: { type: Boolean, default: false },
  ticketTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  
  // Registration
  requiresApproval: { type: Boolean, default: false },
  registrationFields: [{
    name: String,
    label: String,
    type: String, // text, email, phone, select, checkbox
    required: Boolean,
    options: [String] // for select/checkbox
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Cancelled', 'Completed'],
    default: 'Published'
  },
  
  // Settings
  isPublic: { type: Boolean, default: true },
  allowWaitlist: { type: Boolean, default: false },
  sendReminders: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);