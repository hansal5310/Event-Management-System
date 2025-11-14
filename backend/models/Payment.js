const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  rsvp: { type: mongoose.Schema.Types.ObjectId, ref: 'RSVP', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  paymentMethod: { 
    type: String, 
    enum: ['Card', 'UPI', 'Wallet', 'NetBanking'],
    required: true 
  },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  
  transactionId: { type: String, unique: true },
  paymentGateway: { type: String }, // Razorpay, Stripe, etc.
  
  invoiceUrl: { type: String },
  
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundDate: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

module.exports = mongoose.model('Payment', paymentSchema);