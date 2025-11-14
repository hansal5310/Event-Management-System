const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  type: {
    type: String,
    enum: ['EventReminder', 'PaymentConfirmation', 'EventUpdate', 'VendorRequest', 'Message'],
    required: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  
  read: { type: Boolean, default: false },
  
  actionUrl: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);