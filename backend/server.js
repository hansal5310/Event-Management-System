require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const apiRoutes = require('./api');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.164.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MERN Event Management Backend is running!' });
});

// Error handling middleware (must be after all other middleware/routes)
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend API available at: http://localhost:${PORT}/api`);
});