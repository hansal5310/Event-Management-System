require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.164.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const apiRoutes = require('./api');
const paymentRoutes = require('./routes/payments');
const vendorRoutes = require('./routes/vendors');
const checkinRoutes = require('./routes/checkin');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

// Routes
app.use('/api', apiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Event Management Backend is running!' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Backend API available at: http://localhost:${PORT}/api`);
});