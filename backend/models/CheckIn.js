const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  rsvp: { type: mongoose.Schema.Types.ObjectId, ref: 'RSVP', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  checkInTime: { type: Date, default: Date.now },
  checkInMethod: { 
    type: String, 
    enum: ['QRCode', 'Manual', 'App'],
    default: 'QRCode'
  },
  
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff member
  
  location: {
    latitude: Number,
    longitude: Number
  },
  
  notes: { type: String }
});

module.exports = mongoose.model('CheckIn', checkInSchema);