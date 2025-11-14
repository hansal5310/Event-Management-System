const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Admin', 'Vendor'], default: 'User' },
  phone: { type: String },
  profileImage: { type: String },
  
  // Vendor specific fields
  vendorType: { 
    type: String, 
    enum: ['Caterer', 'Decorator', 'Photographer', 'DJ', 'Venue', 'Other'] 
  },
  businessName: { type: String },
  businessDescription: { type: String },
  serviceArea: [String],
  portfolio: [String], // Array of image URLs
  rating: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);