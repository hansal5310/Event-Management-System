const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const RSVP = require('../models/RSVP');
const Razorpay = require('razorpay'); // npm install razorpay
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create payment order
router.post('/create-order', async (req, res) => {
  try {
    const { rsvpId, amount } = req.body;
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `rcpt_${rsvpId}`,
      payment_capture: 1
    };
    
    const order = await razorpay.orders.create(options);
    
    const payment = new Payment({
      rsvp: rsvpId,
      user: req.user.id,
      event: req.body.eventId,
      amount: amount,
      paymentMethod: req.body.paymentMethod || 'Card',
      transactionId: order.id,
      paymentGateway: 'Razorpay',
      status: 'Pending'
    });
    
    await payment.save();
    
    res.json({ orderId: order.id, paymentId: payment._id });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    
    const text = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    if (signature === expectedSignature) {
      const payment = await Payment.findOne({ transactionId: orderId });
      payment.status = 'Completed';
      payment.completedAt = new Date();
      await payment.save();
      
      // Update RSVP status
      await RSVP.findByIdAndUpdate(payment.rsvp, { status: 'Confirmed' });
      
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get payment history
router.get('/history', async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Request refund
router.post('/refund/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (payment.status !== 'Completed') {
      return res.status(400).json({ message: 'Cannot refund incomplete payment' });
    }
    
    // Process refund through Razorpay
    const refund = await razorpay.payments.refund(payment.transactionId, {
      amount: payment.amount * 100,
      speed: 'normal'
    });
    
    payment.status = 'Refunded';
    payment.refundAmount = payment.amount;
    payment.refundReason = req.body.reason;
    payment.refundDate = new Date();
    await payment.save();
    
    res.json({ success: true, message: 'Refund processed successfully' });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ message: 'Refund processing failed' });
  }
});

module.exports = router;