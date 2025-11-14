const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { 
    type: String, 
    enum: ['General', 'VIP', 'EarlyBird', 'Student', 'Group'],
    default: 'General'
  },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  description: { type: String },
  benefits: [String],
  salesStartDate: { type: Date },
  salesEndDate: { type: Date },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Ticket', ticketSchema);