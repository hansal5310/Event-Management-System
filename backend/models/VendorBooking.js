const mongoose = require('mongoose');

const vendorBookingSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  serviceType: { type: String, required: true },
  description: { type: String },
  requirements: { type: String },
  
  quotedPrice: { type: Number },
  finalPrice: { type: Number },
  
  status: {
    type: String,
    enum: ['Requested', 'Quoted', 'Accepted', 'Rejected', 'Completed'],
    default: 'Requested'
  },
  
  notes: [{ 
    text: String, 
    createdBy: mongoose.Schema.Types.ObjectId, 
    createdAt: { type: Date, default: Date.now } 
  }],
  
  contract: { type: String }, // URL to contract document
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorBooking', vendorBookingSchema);