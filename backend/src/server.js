const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../../build')));

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/courses', require('../routes/courses'));
app.use('/api/enrollments', require('../routes/enrollments'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working with MongoDB!' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ API available at http://localhost:${PORT}/api`);
  console.log(`✅ Database: MongoDB`);
});